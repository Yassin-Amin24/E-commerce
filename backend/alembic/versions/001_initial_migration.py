"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2026-02-17

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('created_at', sa.Date(), nullable=True),
    )
    op.create_index('ix_users_email', 'users', ['email'])
    
    # Create products table
    op.create_table(
        'products',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('price', sa.Numeric(10, 2), nullable=False),
        sa.Column('seller_name', sa.String(), nullable=False),
        sa.Column('arrival_date', sa.Date(), nullable=False),
        sa.Column('stock', sa.Integer(), nullable=False),
        sa.Column('image_url', sa.String(), nullable=False),
        sa.Column('created_at', sa.Date(), nullable=True),
    )
    
    # Create carts table
    op.create_table(
        'carts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )
    
    # Create cart_items table
    op.create_table(
        'cart_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('cart_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['cart_id'], ['carts.id']),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.UniqueConstraint('cart_id', 'product_id', name='unique_cart_product'),
    )
    
    # Create reviews table
    op.create_table(
        'reviews',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=False),
        sa.Column('created_at', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.UniqueConstraint('user_id', 'product_id', name='unique_user_product_review'),
    )


def downgrade() -> None:
    op.drop_table('reviews')
    op.drop_table('cart_items')
    op.drop_table('carts')
    op.drop_table('products')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
