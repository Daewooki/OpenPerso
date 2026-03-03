"""add_message_image_audio_url

Revision ID: a1b2c3d4e5f6
Revises: 2693ecb69366
Create Date: 2026-02-20 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '2693ecb69366'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('messages', sa.Column('image_url', sa.String(length=1000), nullable=True))
    op.add_column('messages', sa.Column('audio_url', sa.String(length=1000), nullable=True))


def downgrade() -> None:
    op.drop_column('messages', 'audio_url')
    op.drop_column('messages', 'image_url')
