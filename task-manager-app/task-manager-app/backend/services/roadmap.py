import re
from typing import Dict, Any, List

def generate_custom_curriculum(goal_title: str, duration_months: int, rough_notes: str) -> Dict[str, Any]:
    """
    Parses user-provided goal and rough notes/milestones into a synchronized multi-month roadmap.
    Splits into monthly phases, weekly milestones, and actionable daily tasks with time estimates.
    """
    if duration_months < 1:
        duration_months = 1

    lines = [l.strip() for l in rough_notes.splitlines() if l.strip()]
    
    # If user didn't provide enough detail, generate structured phases from the lines
    phases = []
    
    # Check if lines have Month/Week headers or just raw topics
    month_chunks = {}
    current_month = 1
    
    for line in lines:
        m_match = re.match(r'^(?:month|phase)\s*(\d+)[:\-\s]*(.*)', line, re.IGNORECASE)
        if m_match:
            current_month = int(m_match.group(1))
            theme = m_match.group(2).strip() or f"Phase {current_month}"
            month_chunks[current_month] = {"theme": theme, "items": []}
        else:
            if current_month not in month_chunks:
                month_chunks[current_month] = {"theme": f"Foundation & Setup", "items": []}
            month_chunks[current_month]["items"].append(line.lstrip('-*• \t'))

    # If no explicit month headers found, distribute lines evenly across duration_months
    if not month_chunks:
        items_per_month = max(1, len(lines) // duration_months) if lines else 2
        for m in range(1, duration_months + 1):
            start_idx = (m - 1) * items_per_month
            end_idx = start_idx + items_per_month if m < duration_months else len(lines)
            chunk_items = lines[start_idx:end_idx] if lines else [f"Progressive milestone {m} for {goal_title}"]
            month_chunks[m] = {
                "theme": f"Phase {m}: Focus Area",
                "items": chunk_items
            }

    # Ensure all months up to duration_months exist
    for m in range(1, duration_months + 1):
        data = month_chunks.get(m, {"theme": f"Phase {m}: Advanced Practice", "items": [f"Deep practice and review for {goal_title}"]})
        items = data["items"]
        if not items:
            items = [f"Hands-on exercises for {data['theme']}", f"Documentation and practice"]

        # Build 4 weekly blocks per month
        weeks = []
        for w in range(1, 5):
            week_num = (m - 1) * 4 + w
            item_for_week = items[(w - 1) % len(items)]
            weeks.append({
                "week": week_num,
                "focus": f"{item_for_week}",
                "tasks": [
                    {"title": f"Study & conceptual deep dive: {item_for_week}", "minutes": 90, "priority": "high"},
                    {"title": f"Hands-on implementation & coding: {item_for_week}", "minutes": 120, "priority": "high"},
                    {"title": f"Testing, debugging & code review: {item_for_week}", "minutes": 60, "priority": "medium"},
                    {"title": f"Weekly summary notes & git commit: {item_for_week}", "minutes": 45, "priority": "low"}
                ]
            })

        phases.append({
            "month": m,
            "theme": data["theme"],
            "goal": f"Execute core objectives for {data['theme']}",
            "weeks": weeks
        })

    return {
        "title": goal_title,
        "description": f"Custom roadmap tailored for {duration_months} months based on your targets.",
        "duration_months": duration_months,
        "phases": phases
    }

def generate_gsoc_5month_curriculum() -> Dict[str, Any]:
    """
    Curated 5-month syllabus to crack Google Summer of Code (GSoC) from zero.
    """
    return {
        "title": "Google Summer of Code (GSoC) 5-Month Master Roadmap",
        "description": "A comprehensive zero-to-accepted roadmap engineered to take you from fundamentals to submitted proposal and community bonding.",
        "duration_months": 5,
        "phases": [
            {
                "month": 1,
                "theme": "Open Source & Developer Tooling Foundations",
                "goal": "Master Git/GitHub, Linux CLI, project building from source, and codebase exploration.",
                "weeks": [
                    {
                        "week": 1,
                        "focus": "Git & GitHub Advanced Workflows",
                        "tasks": [
                            {"title": "Master Git branching, rebasing, and resolving merge conflicts", "minutes": 90, "priority": "high"},
                            {"title": "Learn Git interactive rebase and squashing commits", "minutes": 60, "priority": "medium"},
                            {"title": "Configure SSH keys, GPG signing, and GitHub CLI (gh)", "minutes": 45, "priority": "low"},
                            {"title": "Practice fork-and-pull PR workflow on mock repo", "minutes": 60, "priority": "high"}
                        ]
                    },
                    {
                        "week": 2,
                        "focus": "Linux & Build Systems (Make, CMake, Meson, Docker)",
                        "tasks": [
                            {"title": "Deep dive into GNU Make and CMake build scripts", "minutes": 120, "priority": "high"},
                            {"title": "Setup Docker containerized dev environments", "minutes": 90, "priority": "medium"},
                            {"title": "Practice compiling large open-source C/C++ or Python projects", "minutes": 120, "priority": "high"}
                        ]
                    },
                    {
                        "week": 3,
                        "focus": "Target Organization Scouting",
                        "tasks": [
                            {"title": "Audit past GSoC orgs in your stack (e.g., VideoLAN, QEMU, CCF, Apache, KDE)", "minutes": 90, "priority": "high"},
                            {"title": "Select top 2 primary target organizations", "minutes": 60, "priority": "high"},
                            {"title": "Join communication channels (IRC, Matrix, Zulip, Discord, Mailing lists)", "minutes": 45, "priority": "high"}
                        ]
                    },
                    {
                        "week": 4,
                        "focus": "Local Development Setup & First Readthrough",
                        "tasks": [
                            {"title": "Clone target org repo and build successfully on your local machine", "minutes": 120, "priority": "high"},
                            {"title": "Read developer documentation, CONTRIBUTING.md, and Code of Conduct", "minutes": 60, "priority": "medium"},
                            {"title": "Run test suites and confirm all unit tests pass", "minutes": 90, "priority": "high"}
                        ]
                    }
                ]
            },
            {
                "month": 2,
                "theme": "First Contributions & Community Visibility",
                "goal": "Solve 'good first issues', submit initial PRs, and establish regular communication with maintainers.",
                "weeks": [
                    {
                        "week": 5,
                        "focus": "Bug Hunting & 'Good First Issue' Filtering",
                        "tasks": [
                            {"title": "Filter tracker for 'good-first-issue' or 'beginner-friendly' tags", "minutes": 60, "priority": "high"},
                            {"title": "Reproduce a reported bug locally and inspect stack trace", "minutes": 90, "priority": "high"},
                            {"title": "Comment on the issue introducing yourself and claiming it", "minutes": 30, "priority": "medium"}
                        ]
                    },
                    {
                        "week": 6,
                        "focus": "Submitting First Pull Request",
                        "tasks": [
                            {"title": "Write the bugfix code with clear comments", "minutes": 120, "priority": "high"},
                            {"title": "Write regression tests verifying the fix", "minutes": 90, "priority": "high"},
                            {"title": "Format commit message adhering to project convention and submit PR", "minutes": 45, "priority": "high"}
                        ]
                    },
                    {
                        "week": 7,
                        "focus": "Code Review & Iteration",
                        "tasks": [
                            {"title": "Address reviewer feedback constructively within 24 hours", "minutes": 90, "priority": "high"},
                            {"title": "Amend commits and push clean update to PR branch", "minutes": 45, "priority": "medium"},
                            {"title": "Get first PR merged into mainline repository", "minutes": 30, "priority": "high"}
                        ]
                    },
                    {
                        "week": 8,
                        "focus": "Second Meaningful Contribution",
                        "tasks": [
                            {"title": "Pick a medium-difficulty issue touching core logic", "minutes": 90, "priority": "high"},
                            {"title": "Discuss proposed architecture with maintainers in Zulip/IRC", "minutes": 60, "priority": "high"},
                            {"title": "Implement feature and submit second PR", "minutes": 120, "priority": "high"}
                        ]
                    }
                ]
            },
            {
                "month": 3,
                "theme": "Idea Selection & Mentorship Alignment",
                "goal": "Analyze official GSoC project ideas list, connect with potential mentors, and formulate project scope.",
                "weeks": [
                    {
                        "week": 9,
                        "focus": "Ideas List Deep Dive",
                        "tasks": [
                            {"title": "Analyze official project ideas list released by org", "minutes": 90, "priority": "high"},
                            {"title": "Match skills with 2 specific project ideas", "minutes": 60, "priority": "high"},
                            {"title": "Identify mentors assigned to those ideas", "minutes": 30, "priority": "medium"}
                        ]
                    },
                    {
                        "week": 10,
                        "focus": "Engaging Potential Mentors",
                        "tasks": [
                            {"title": "Draft polite introductory message showing your prior merged PRs", "minutes": 45, "priority": "high"},
                            {"title": "Ask targeted technical questions about the project idea scope", "minutes": 60, "priority": "high"}
                        ]
                    },
                    {
                        "week": 11,
                        "focus": "Proof of Concept (PoC)",
                        "tasks": [
                            {"title": "Build minimal prototype demonstrating feasibility of project idea", "minutes": 150, "priority": "high"},
                            {"title": "Document prototype benchmarks and results", "minutes": 60, "priority": "medium"}
                        ]
                    },
                    {
                        "week": 12,
                        "focus": "Sharing PoC with Mentors",
                        "tasks": [
                            {"title": "Share prototype repository with mentors for early feedback", "minutes": 45, "priority": "high"},
                            {"title": "Refine project milestones based on mentor suggestions", "minutes": 60, "priority": "high"}
                        ]
                    }
                ]
            },
            {
                "month": 4,
                "theme": "Proposal Drafting & Mock Evaluations",
                "goal": "Draft, review, and polish a winning GSoC proposal with weekly breakdown and deliverable milestones.",
                "weeks": [
                    {
                        "week": 13,
                        "focus": "Proposal Outline & Architecture",
                        "tasks": [
                            {"title": "Study successful proposals from previous years", "minutes": 90, "priority": "high"},
                            {"title": "Draft Executive Summary, Project Abstract, and Architecture Diagrams", "minutes": 120, "priority": "high"}
                        ]
                    },
                    {
                        "week": 14,
                        "focus": "Detailed Timeline & Deliverables",
                        "tasks": [
                            {"title": "Create granular 12-week coding phase breakdown with buffer weeks", "minutes": 120, "priority": "high"},
                            {"title": "Define test plan, documentation plan, and quantifiable deliverables", "minutes": 90, "priority": "medium"}
                        ]
                    },
                    {
                        "week": 15,
                        "focus": "First Mentor Review",
                        "tasks": [
                            {"title": "Submit draft proposal to mentors via Google Docs for commenting", "minutes": 30, "priority": "high"},
                            {"title": "Incorporate all mentor feedback, edge cases, and scope adjustments", "minutes": 120, "priority": "high"}
                        ]
                    },
                    {
                        "week": 16,
                        "focus": "Peer Review & Polish",
                        "tasks": [
                            {"title": "Get proposal reviewed by past GSoC contributors/alumni", "minutes": 60, "priority": "medium"},
                            {"title": "Proofread for clarity, professional tone, and eliminate ambiguities", "minutes": 60, "priority": "medium"}
                        ]
                    }
                ]
            },
            {
                "month": 5,
                "theme": "Final Submission & Community Bonding",
                "goal": "Submit proposal via official GSoC portal, maintain code contributions, and prepare for coding period.",
                "weeks": [
                    {
                        "week": 17,
                        "focus": "Final Portal Submission",
                        "tasks": [
                            {"title": "Convert proposal to PDF according to org guidelines", "minutes": 30, "priority": "high"},
                            {"title": "Submit proposal on official GSoC portal well before deadline", "minutes": 30, "priority": "high"},
                            {"title": "Verify upload confirmation and proof of enrollment", "minutes": 15, "priority": "high"}
                        ]
                    },
                    {
                        "week": 18,
                        "focus": "Continued Active Involvement",
                        "tasks": [
                            {"title": "Continue reviewing community PRs and triaging issues", "minutes": 90, "priority": "high"},
                            {"title": "Submit one more quality PR to maintain community presence", "minutes": 120, "priority": "medium"}
                        ]
                    },
                    {
                        "week": 19,
                        "focus": "Preliminary Tooling & Scaffolding",
                        "tasks": [
                            {"title": "Prepare dev branch and boilerplate for week 1 of coding period", "minutes": 90, "priority": "medium"},
                            {"title": "Sync with mentors regarding communication schedule during summer", "minutes": 45, "priority": "high"}
                        ]
                    },
                    {
                        "week": 20,
                        "focus": "Results Day & Summer Coding Kickoff",
                        "tasks": [
                            {"title": "Review announcement of accepted student projects", "minutes": 15, "priority": "high"},
                            {"title": "Set up weekly progress tracking notes and blog log", "minutes": 60, "priority": "high"}
                        ]
                    }
                ]
            }
        ]
    }
