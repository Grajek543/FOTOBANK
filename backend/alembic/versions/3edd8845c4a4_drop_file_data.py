"""drop file_data

Revision ID: 3edd8845c4a4
Revises: 01faacf78025
Create Date: 2025-05-05 23:53:25.597687

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '3edd8845c4a4'
down_revision: Union[str, None] = '01faacf78025'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('photos', 'file_data')

def downgrade() -> None:
    op.add_column('photos',
        sa.Column('file_data', sa.LargeBinary(), nullable=True))