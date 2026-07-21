from enum import Enum

class ConversationType(str, Enum):
    PRIVATE = "private"
    GROUP = "group"


class MemberRole(str, Enum):
    MEMBER = "member"
    ADMIN = "admin"