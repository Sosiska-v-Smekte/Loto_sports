"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-10-20 13:28:45.009631
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("about", sa.Text(), nullable=True),
        sa.Column("is_admin", sa.Boolean(), nullable=False),
        sa.Column(
            "notify_new", sa.Boolean(), server_default=sa.text("true"), nullable=False
        ),
        sa.Column(
            "notify_remind",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("link", sa.String(length=300), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("dedup_key", sa.String(length=200), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("dedup_key"),
    )
    op.create_index(
        op.f("ix_notifications_created_at"),
        "notifications",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False
    )
    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("sports", sa.String(length=500), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("contacts", sa.String(length=500), nullable=False),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_id"),
    )
    op.create_index(
        op.f("ix_organizations_status"), "organizations", ["status"], unique=False
    )
    op.create_table(
        "sessions",
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("token"),
    )
    op.create_index(op.f("ix_sessions_user_id"), "sessions", ["user_id"], unique=False)
    op.create_table(
        "sports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("normalized_name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=60), nullable=True),
        sa.Column("color", sa.String(length=9), nullable=False),
        sa.Column("icon", sa.String(length=16), nullable=False),
        sa.Column("is_custom", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_sports_normalized_name"), "sports", ["normalized_name"], unique=True
    )
    op.create_table(
        "interests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("sport_id", sa.Integer(), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("district", sa.String(length=80), nullable=False),
        sa.Column("day_kind", sa.String(length=20), nullable=False),
        sa.Column("day_part", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["sport_id"],
            ["sports.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id", "sport_id", "city", "day_kind", "day_part", name="uq_interest"
        ),
    )
    op.create_index(op.f("ix_interests_city"), "interests", ["city"], unique=False)
    op.create_index(
        op.f("ix_interests_sport_id"), "interests", ["sport_id"], unique=False
    )
    op.create_index(
        op.f("ix_interests_user_id"), "interests", ["user_id"], unique=False
    )
    op.create_table(
        "organization_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"], ["organizations.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "user_id", name="uq_org_member"),
    )
    op.create_index(
        op.f("ix_organization_members_organization_id"),
        "organization_members",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_organization_members_user_id"),
        "organization_members",
        ["user_id"],
        unique=False,
    )
    op.create_table(
        "user_sports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("sport_id", sa.Integer(), nullable=False),
        sa.Column("level", sa.String(length=20), nullable=False),
        sa.ForeignKeyConstraint(
            ["sport_id"],
            ["sports.id"],
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "sport_id", name="uq_user_sport"),
    )
    op.create_index(
        op.f("ix_user_sports_user_id"), "user_sports", ["user_id"], unique=False
    )
    op.create_table(
        "venues",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("address", sa.String(length=300), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_venues_city"), "venues", ["city"], unique=False)
    op.create_index(op.f("ix_venues_owner_id"), "venues", ["owner_id"], unique=False)
    op.create_table(
        "zones",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("venue_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("group_name", sa.String(length=120), nullable=True),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("buffer_minutes", sa.Integer(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["venue_id"],
            ["venues.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_zones_venue_id"), "zones", ["venue_id"], unique=False)
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("sport_id", sa.Integer(), nullable=False),
        sa.Column("organizer_user_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.Column("starts_at", sa.DateTime(), nullable=False),
        sa.Column("ends_at", sa.DateTime(), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("address", sa.String(length=300), nullable=False),
        sa.Column("place_details", sa.Text(), nullable=False),
        sa.Column("zone_id", sa.Integer(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("level", sa.String(length=20), nullable=False),
        sa.Column("requirements", sa.Text(), nullable=False),
        sa.Column("join_mode", sa.String(length=20), nullable=False),
        sa.Column("card_color", sa.String(length=7), nullable=True),
        sa.Column("card_pattern", sa.String(length=16), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("moderation_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
        ),
        sa.ForeignKeyConstraint(
            ["organizer_user_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["sport_id"],
            ["sports.id"],
        ),
        sa.ForeignKeyConstraint(
            ["zone_id"],
            ["zones.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_events_city"), "events", ["city"], unique=False)
    op.create_index(
        op.f("ix_events_organization_id"), "events", ["organization_id"], unique=False
    )
    op.create_index(
        op.f("ix_events_organizer_user_id"),
        "events",
        ["organizer_user_id"],
        unique=False,
    )
    op.create_index(op.f("ix_events_sport_id"), "events", ["sport_id"], unique=False)
    op.create_index(op.f("ix_events_starts_at"), "events", ["starts_at"], unique=False)
    op.create_index(op.f("ix_events_status"), "events", ["status"], unique=False)
    op.create_index(op.f("ix_events_zone_id"), "events", ["zone_id"], unique=False)
    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("is_hidden", sa.Boolean(), nullable=False),
        sa.Column("hidden_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["author_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["event_id"],
            ["events.id"],
        ),
        sa.ForeignKeyConstraint(
            ["parent_id"],
            ["comments.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_comments_event_id"), "comments", ["event_id"], unique=False
    )
    op.create_index(
        op.f("ix_comments_parent_id"), "comments", ["parent_id"], unique=False
    )
    op.create_table(
        "participations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("decided_at", sa.DateTime(), nullable=True),
        sa.Column("hidden_by_user", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["event_id"],
            ["events.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "user_id", name="uq_participation_event_user"),
    )
    op.create_index(
        op.f("ix_participations_event_id"), "participations", ["event_id"], unique=False
    )
    op.create_index(
        op.f("ix_participations_user_id"), "participations", ["user_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_participations_user_id"), table_name="participations")
    op.drop_index(op.f("ix_participations_event_id"), table_name="participations")
    op.drop_table("participations")
    op.drop_index(op.f("ix_comments_parent_id"), table_name="comments")
    op.drop_index(op.f("ix_comments_event_id"), table_name="comments")
    op.drop_table("comments")
    op.drop_index(op.f("ix_events_zone_id"), table_name="events")
    op.drop_index(op.f("ix_events_status"), table_name="events")
    op.drop_index(op.f("ix_events_starts_at"), table_name="events")
    op.drop_index(op.f("ix_events_sport_id"), table_name="events")
    op.drop_index(op.f("ix_events_organizer_user_id"), table_name="events")
    op.drop_index(op.f("ix_events_organization_id"), table_name="events")
    op.drop_index(op.f("ix_events_city"), table_name="events")
    op.drop_table("events")
    op.drop_index(op.f("ix_zones_venue_id"), table_name="zones")
    op.drop_table("zones")
    op.drop_index(op.f("ix_venues_owner_id"), table_name="venues")
    op.drop_index(op.f("ix_venues_city"), table_name="venues")
    op.drop_table("venues")
    op.drop_index(op.f("ix_user_sports_user_id"), table_name="user_sports")
    op.drop_table("user_sports")
    op.drop_index(
        op.f("ix_organization_members_user_id"), table_name="organization_members"
    )
    op.drop_index(
        op.f("ix_organization_members_organization_id"),
        table_name="organization_members",
    )
    op.drop_table("organization_members")
    op.drop_index(op.f("ix_interests_user_id"), table_name="interests")
    op.drop_index(op.f("ix_interests_sport_id"), table_name="interests")
    op.drop_index(op.f("ix_interests_city"), table_name="interests")
    op.drop_table("interests")
    op.drop_index(op.f("ix_sports_normalized_name"), table_name="sports")
    op.drop_table("sports")
    op.drop_index(op.f("ix_sessions_user_id"), table_name="sessions")
    op.drop_table("sessions")
    op.drop_index(op.f("ix_organizations_status"), table_name="organizations")
    op.drop_table("organizations")
    op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_created_at"), table_name="notifications")
    op.drop_table("notifications")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
