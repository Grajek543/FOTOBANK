"""add thumb_path to photos

Revision ID: c914393f852a
Revises: 8b265810aca0
Create Date: 2025-05-05 23:31:43.107880

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql
from sqlalchemy import text 

# revision identifiers, used by Alembic.
revision: str = 'c914393f852a'
down_revision: Union[str, None] = '8b265810aca0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1️⃣  nowa kolumna
    op.add_column(
        "photos",
        sa.Column("thumb_path", sa.String(length=255), nullable=True)
    )

    # 2️⃣  wypełnij istniejące NULL‑e w file_path
    conn = op.get_bind()
    conn.execute(text(
        "UPDATE photos SET file_path = '' WHERE file_path IS NULL"
    ))

    # 3️⃣  teraz wymuś NOT NULL
    op.alter_column(
        "photos",
        "file_path",
        existing_type=sa.String(length=255),
        nullable=False
    )

    # 4️⃣  zmiana typu description (to zostawił autogenerator)
    op.alter_column(
        "photos",
        "description",
        existing_type=sa.VARCHAR(length=1024),
        type_=sa.Text(),
        existing_nullable=True,
    )
def downgrade() -> None:
    # 4️⃣ przywróć description do VARCHAR(1024)
    op.alter_column(
        "photos",
        "description",
        existing_type=sa.Text(),
        type_=sa.VARCHAR(length=1024),
        existing_nullable=True,
    )

    # 3️⃣ znieś NOT NULL na file_path
    op.alter_column(
        "photos",
        "file_path",
        existing_type=sa.String(length=255),
        nullable=True,
    )

    # 2️⃣ (tu nic nie trzeba, bo UPDATE w upgrade nie zmienia struktury)

    # 1️⃣ usuń kolumnę thumb_path
    op.drop_column("photos", "thumb_path")