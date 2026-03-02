"""Marketplace and chat overhaul

Revision ID: 002_marketplace_chat
Revises: 001_initial
Create Date: 2026-02-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "002_marketplace_chat"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table("reviews")
    op.drop_table("cart_items")
    op.drop_table("carts")
    op.drop_table("products")

    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("location", sa.String(), nullable=False),
        sa.Column("image_urls", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("seller_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"], name="fk_products_seller"),
    )

    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.UniqueConstraint("user_id", "product_id", name="unique_user_product_review"),
    )

    op.create_table(
        "conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("buyer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("seller_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name="fk_conversation_product"),
        sa.ForeignKeyConstraint(["buyer_id"], ["users.id"], name="fk_conversation_buyer"),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"], name="fk_conversation_seller"),
        sa.UniqueConstraint("product_id", "buyer_id", "seller_id", name="unique_conversation"),
    )

    # ensure reruns remove any partially created enums from failed deploys
    op.execute("DROP TYPE IF EXISTS message_status CASCADE")

    message_status = postgresql.ENUM(
        "sent",
        "delivered",
        "read",
        name="message_status",
        create_type=False,
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'message_status'
            ) THEN
                CREATE TYPE message_status AS ENUM ('sent','delivered','read');
            END IF;
        END$$;
        """
    )

    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("receiver_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("sent_at", sa.DateTime(), nullable=True),
        sa.Column("status", message_status, nullable=False, server_default="sent"),
        sa.Column("delivered_at", sa.DateTime(), nullable=True),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], name="fk_message_conversation"),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], name="fk_message_sender"),
        sa.ForeignKeyConstraint(["receiver_id"], ["users.id"], name="fk_message_receiver"),
    )


def downgrade() -> None:
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("reviews")
    op.drop_table("products")

    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("seller_name", sa.String(), nullable=False),
        sa.Column("arrival_date", sa.Date(), nullable=False),
        sa.Column("stock", sa.Integer(), nullable=False),
        sa.Column("image_url", sa.String(), nullable=False),
        sa.Column("created_at", sa.Date(), nullable=True),
    )

    op.create_table(
        "carts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )

    op.create_table(
        "cart_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("cart_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["cart_id"], ["carts.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.UniqueConstraint("cart_id", "product_id", name="unique_cart_product"),
    )

    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.Column("created_at", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.UniqueConstraint("user_id", "product_id", name="unique_user_product_review"),
    )

    message_status = sa.Enum(name="message_status")
    message_status.drop(op.get_bind(), checkfirst=True)
