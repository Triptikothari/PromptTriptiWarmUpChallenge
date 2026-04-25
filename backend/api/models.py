from django.db import models

class UserProfile(models.Model):
    session_id = models.CharField(max_length=255, unique=True, default='default_user')
    
    # Explicit preferences (can still be overridden)
    language = models.CharField(max_length=50, default='English')
    
    # Behavioral analytics fields
    struggle_count = models.IntegerField(default=0)  # Count of "I don't understand" or "No"
    success_count = models.IntegerField(default=0)   # Count of fast "Yes, I understand"
    deep_dive_count = models.IntegerField(default=0) # Count of detailed follow-up questions
    
    @property
    def learning_pace(self):
        # Calculate pace based on history
        if self.struggle_count > getattr(self, 'success_count', 0) + 1:
            return "Slow Learner"
        elif getattr(self, 'success_count', 0) > self.struggle_count + 1:
            return "Fast Learner"
        return "Moderate Pace"

    @property
    def depth_preference(self):
        # Calculate depth based on detailed question frequency
        if self.deep_dive_count >= 2:
            return "Deep-Dive"
        return "Surface-Level"

    def __str__(self):
        return f"{self.session_id} - {self.language} ({self.learning_pace})"

class LearningHistory(models.Model):
    profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='history')
    concept = models.CharField(max_length=255)
    learned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.concept} learned at {self.learned_at}"
