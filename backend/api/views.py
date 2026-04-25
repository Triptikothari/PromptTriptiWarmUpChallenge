from rest_framework.views import APIView
from rest_framework.response import Response
from .models import UserProfile, LearningHistory
from .serializers import UserProfileSerializer
import json
import random
import os
from dotenv import load_dotenv
import google.generativeai as genai
import logging
from django.conf import settings


class ProfileView(APIView):
    def get(self, request):
        profile, created = UserProfile.objects.get_or_create(session_id='default_user')
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    def post(self, request):
        profile, created = UserProfile.objects.get_or_create(session_id='default_user')
        profile.language = request.data.get('language', profile.language)
        profile.save()
        return Response({'status': 'updated'})


class ChatView(APIView):
    def post(self, request):
        profile, _ = UserProfile.objects.get_or_create(session_id='default_user')
        concept = request.data.get('concept', '')

        if not concept:
            return Response({'error': 'No concept provided'}, status=400)

        user_input_lower = concept.lower()
        
        # Behavioral Feedback Loop
        if user_input_lower in ['yes', 'i understand', 'makes sense', 'got it', 'yup']:
            profile.success_count += 1
            profile.save()
            return Response({
                'response': "Awesome! I'm glad that made sense. I've noted you are picking this up quickly. What concept would you like to explore next?",
                'history': list(profile.history.values_list('concept', flat=True))
            })
        elif user_input_lower in ['no', "i don't understand", "i didnt understand", 'confusing', 'nope', "what?"]:
            profile.struggle_count += 1
            profile.save()
            return Response({
                'response': "No worries! Everyone learns differently. Let's slow down and try breaking it down another way. Which part was the most confusing?",
                'history': list(profile.history.values_list('concept', flat=True))
            })
        elif '?' in concept and len(concept.split()) > 5:
            # User is asking a detailed, deep-dive question
            profile.deep_dive_count += 1
            profile.save()

        clean_concept = " ".join(concept.split(" ")[:4]).replace('?', '')
        if clean_concept and not profile.history.filter(concept=clean_concept).exists():
            LearningHistory.objects.create(profile=profile, concept=clean_concept)

        history_concepts = list(profile.history.values_list('concept', flat=True))
        
        language = profile.language
        pace = profile.learning_pace
        depth = profile.depth_preference

        # Compile System Prompt for the LLM
        past_concepts_str = ", ".join(history_concepts) if history_concepts else "None"
        
        system_prompt = f"""
        You are an expert learning assistant. 
        The user's baseline preferred language is '{language}'. 
        IMPORTANT RULE: If the user's specific request ('{concept}') asks you to translate or explain in a DIFFERENT language, you MUST obey their request and provide your entire response in that newly requested language.

        Based on their behavioral analytics, they are currently categorized as a '{pace}' and prefer '{depth}' explanations. 
        Their past learned concepts are: [{past_concepts_str}].

        Please respond to the user's input/concept: '{concept}'.
        
        CRITICAL INSTRUCTIONS:
        - If they are a 'Fast Learner', keep it extremely brief and high-level.
        - If they are a 'Slow Learner', break it down gently with simple analogies.
        - If they prefer a 'Deep-Dive', write a very detailed technical explanation.
        - Relate the explanation to their past learned concepts if it makes sense.
        - Format your response using basic HTML tags (like <br>, <strong>, <ul>, <li>) because it will be rendered dynamically in a frontend div. Do not use Markdown backticks.
        """

        ai_content = ""
        # Call Gemini API with Google Search Grounding
        if settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                
                # Enable Google Search tool for grounded responses
                model = genai.GenerativeModel(
                    model_name='gemini-1.5-flash',
                    tools=[{'google_search_retrieval': {}}]
                )
                
                response = model.generate_content(system_prompt)
                ai_content = response.text
            except Exception as e:
                logging.error(f"Gemini API Error: {e}")
                ai_content = f"<em>(AI Generation Failed. Error: {e})</em><br><br>Here is a generic explanation for <strong>{concept}</strong>."
        else:
            ai_content = f"<em>(Google Gemini API Key is missing! Add it to the backend /.env file)</em><br><br>Here is the mock response for <strong>{concept}</strong> based on {pace} and {depth} constraints."

        final_response_text = f"{ai_content}<br><br><hr/><br><strong>Does this explanation make sense? (Yes / No)</strong>"

        return Response({
            'response': final_response_text,
            'history': history_concepts
        })


class ClearHistoryView(APIView):
    def post(self, request):
        profile, _ = UserProfile.objects.get_or_create(session_id='default_user')
        profile.history.all().delete()
        # Reset analytics on clear
        profile.struggle_count = 0
        profile.success_count = 0
        profile.deep_dive_count = 0
        profile.save()
        return Response({'status': 'cleared'})
