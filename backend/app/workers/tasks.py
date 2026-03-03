from app.workers.celery_app import celery_app


@celery_app.task(name="summarize_conversation")
def summarize_conversation(conversation_id: str):
    """Summarize a conversation and extract memories after session ends.
    Planned: sync DB session + LLM call for conversation summarization.
    """
    raise NotImplementedError("Conversation summarization not yet implemented")


@celery_app.task(name="extract_deep_memories")
def extract_deep_memories(conversation_id: str, user_id: str, persona_id: str):
    """Extract implicit memories from conversation using LLM.
    Planned: sync DB session + LLM call for deep memory extraction.
    """
    raise NotImplementedError("Deep memory extraction not yet implemented")
