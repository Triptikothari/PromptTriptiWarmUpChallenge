from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from .models import UserProfile, LearningHistory
from unittest.mock import patch, MagicMock

class ApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.profile = UserProfile.objects.create(session_id='default_user')

    def test_get_profile(self):
        """Test retrieving the user profile"""
        url = reverse('profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['language'], 'English')

    def test_update_profile_language(self):
        """Test updating profile language"""
        url = reverse('profile')
        response = self.client.post(url, {'language': 'French'}, format='json')
        self.assertEqual(response.status_code, 200)
        
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.language, 'French')

    def test_clear_history(self):
        """Test clearing user history and analytics"""
        LearningHistory.objects.create(profile=self.profile, concept='Quantum')
        self.profile.struggle_count = 5
        self.profile.save()

        url = reverse('clear_history')
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.history.count(), 0)
        self.assertEqual(self.profile.struggle_count, 0)

    @patch('google.generativeai.GenerativeModel.generate_content')
    def test_chat_ai_response(self, mock_generate):
        """Test chat endpoint with mocked Gemini response"""
        # Mocking the Gemini response object
        mock_response = MagicMock()
        mock_response.text = "This is a <strong>test explanation</strong>."
        mock_generate.return_value = mock_response

        url = reverse('chat')
        response = self.client.post(url, {'concept': 'Machine Learning'}, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('test explanation', response.data['response'])
        self.assertIn('Machine Learning', UserProfile.objects.get(session_id='default_user').history.first().concept)

    def test_chat_behavioral_logic_yes(self):
        """Test behavioral feedback loop (User says Yes)"""
        url = reverse('chat')
        response = self.client.post(url, {'concept': 'yes'}, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('picking this up quickly', response.data['response'])
        
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.success_count, 1)

    def test_chat_behavioral_logic_no(self):
        """Test behavioral feedback loop (User says No)"""
        url = reverse('chat')
        response = self.client.post(url, {'concept': 'no'}, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('slow down and try breaking it down', response.data['response'])
        
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.struggle_count, 1)
