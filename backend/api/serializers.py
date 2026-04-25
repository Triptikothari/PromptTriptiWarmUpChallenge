from rest_framework import serializers
from .models import UserProfile, LearningHistory

class LearningHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningHistory
        fields = ['concept', 'learned_at']

class UserProfileSerializer(serializers.ModelSerializer):
    history = LearningHistorySerializer(many=True, read_only=True)
    learning_pace = serializers.ReadOnlyField()
    depth_preference = serializers.ReadOnlyField()

    class Meta:
        model = UserProfile
        fields = ['language', 'history', 'learning_pace', 'depth_preference', 'struggle_count', 'success_count', 'deep_dive_count']
