from django.urls import path
from .views import ProfileView, ChatView, ClearHistoryView

urlpatterns = [
    path('profile/', ProfileView.as_view(), name='profile'),
    path('chat/', ChatView.as_view(), name='chat'),
    path('history/clear/', ClearHistoryView.as_view(), name='clear_history'),
]
