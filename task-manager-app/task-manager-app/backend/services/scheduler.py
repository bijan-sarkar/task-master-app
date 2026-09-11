from datetime import datetime, timedelta, time
from typing import List, Dict, Any

def parse_time_str(time_str: str) -> time:
    parts = [int(p) for p in time_str.split(":")]
    return time(hour=parts[0], minute=parts[1])

def allocate_tasks_to_free_time(
    tasks: List[Any],
    availability_slots: List[Any],
    start_date: datetime = None
) -> List[Dict[str, Any]]:
    """
    Greedy Interval Packing:
    Takes tasks with estimated_minutes and availability slots across days of the week,
    and assigns concrete scheduled_start and scheduled_end datetimes to each task.
    """
    if not start_date:
        start_date = datetime.now().replace(second=0, microsecond=0)

    # Map weekday (0=Mon, 6=Sun) to list of slot windows (start_time, end_time)
    slots_by_day = {}
    for slot in availability_slots:
        day_of_week = getattr(slot, 'day_of_week', slot.get('day_of_week') if isinstance(slot, dict) else 0)
        start_t_str = getattr(slot, 'start_time', slot.get('start_time') if isinstance(slot, dict) else "19:00")
        end_t_str = getattr(slot, 'end_time', slot.get('end_time') if isinstance(slot, dict) else "22:00")

        if day_of_week not in slots_by_day:
            slots_by_day[day_of_week] = []
        slots_by_day[day_of_week].append((parse_time_str(start_t_str), parse_time_str(end_t_str)))

    # Sort slots within each day by start time
    for day in slots_by_day:
        slots_by_day[day].sort(key=lambda s: s[0])

    allocations = []
    task_idx = 0
    num_tasks = len(tasks)
    
    current_day = start_date.date()
    # Look ahead up to 60 days
    for day_offset in range(60):
        if task_idx >= num_tasks:
            break
            
        target_date = current_day + timedelta(days=day_offset)
        weekday = target_date.weekday()
        
        day_slots = slots_by_day.get(weekday, [])
        for slot_start_t, slot_end_t in day_slots:
            slot_start_dt = datetime.combine(target_date, slot_start_t)
            slot_end_dt = datetime.combine(target_date, slot_end_t)
            
            # If the slot is in the past, skip or adjust
            if slot_end_dt <= start_date:
                continue
            if slot_start_dt < start_date:
                slot_start_dt = start_date

            cursor = slot_start_dt
            while cursor < slot_end_dt and task_idx < num_tasks:
                task = tasks[task_idx]
                task_id = getattr(task, 'id', task.get('id') if isinstance(task, dict) else str(task_idx))
                task_title = getattr(task, 'title', task.get('title') if isinstance(task, dict) else "Task")
                task_est = getattr(task, 'estimated_minutes', task.get('estimated_minutes') if isinstance(task, dict) else 60)

                task_duration = timedelta(minutes=task_est)
                remaining_slot_time = slot_end_dt - cursor
                if remaining_slot_time < timedelta(minutes=15):
                    break

                task_end_dt = cursor + task_duration
                if task_end_dt <= slot_end_dt:
                    allocations.append({
                        "task_id": task_id,
                        "title": task_title,
                        "scheduled_start": cursor,
                        "scheduled_end": task_end_dt,
                        "estimated_minutes": task_est
                    })
                    cursor = task_end_dt + timedelta(minutes=5)
                    task_idx += 1
                else:
                    allocations.append({
                        "task_id": task_id,
                        "title": task_title,
                        "scheduled_start": cursor,
                        "scheduled_end": slot_end_dt,
                        "estimated_minutes": int((slot_end_dt - cursor).total_seconds() / 60)
                    })
                    cursor = slot_end_dt
                    task_idx += 1

    return allocations
