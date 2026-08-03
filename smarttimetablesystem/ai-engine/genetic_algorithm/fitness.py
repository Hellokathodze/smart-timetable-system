TEACHING_PER_DAY = 5  # Target: 5 classes per day PER DIVISION


class FitnessCalculator:

    def __init__(self, genes, break_map=None, room_types=None, subject_types=None):
        """
        Args:
            genes: list of Gene objects
            break_map: {day: slot_number} — break slots to avoid
            room_types: {room_id: "LAB"|"CLASSROOM"} — for lab-room constraint
            subject_types: {original_subject_id: "LAB"|"THEORY"}
        """
        self.genes = genes
        self.break_map = break_map or {}
        self.room_types = room_types or {}
        self.subject_types = subject_types or {}

    def calculate(self, for_display=False):
        """
        for_display=False (default): return raw 100 - penalty (may be negative).
                                     Used during optimization so selection has gradient.
        for_display=True: clamp to [0, 100] for user-facing reporting only.

        Phase 5 fix: clamping to [0, 100] during optimization destroys the
        gradient information for hard problems (all bad chromosomes appear
        equal at fitness=0). Optimization now sees raw values; only display
        clamps.
        """
        penalty = 0

        teacher_timeslot = {}
        room_timeslot = {}
        class_slot_used = {}
        teacher_day_load = {}
        division_day_count = {}

        for gene in self.genes:

            teacher = gene.teacherId
            room = gene.roomId
            timeslot = gene.timeslotId
            division = gene.division

            try:
                day, slot = timeslot.split("-")
                slot_number = int(slot)
            except Exception:
                day = "UNKNOWN"
                slot_number = 0
                penalty += 5

            # BREAK SLOT VIOLATION (hard)
            if day in self.break_map and slot_number == self.break_map[day]:
                penalty += 15

            # LAB-ROOM CONSTRAINT (Phase 2.5)
            #   Hard: LAB subject in non-LAB room  → penalty 15
            #   Soft: THEORY subject in LAB room   → penalty 2
            original_id = gene.subjectId.split("_dup")[0]
            subject_type = self.subject_types.get(original_id, "THEORY")
            room_type = self.room_types.get(room, "CLASSROOM")
            if subject_type == "LAB" and room_type != "LAB":
                penalty += 15
            elif subject_type == "THEORY" and room_type == "LAB":
                penalty += 2

            # Track division-day count
            dd_key = (division, day)
            division_day_count[dd_key] = division_day_count.get(dd_key, 0) + 1

            # Teacher conflict (across all divisions)
            key = (teacher, timeslot)
            if key in teacher_timeslot:
                penalty += 10
            else:
                teacher_timeslot[key] = True

            # Room conflict (across all divisions)
            key = (room, timeslot)
            if key in room_timeslot:
                penalty += 10
            else:
                room_timeslot[key] = True

            # Class-slot collision (same division, same timeslot)
            cs_key = (division, timeslot)
            if cs_key in class_slot_used:
                penalty += 15
            else:
                class_slot_used[cs_key] = True

            # Teacher per-day load tracking
            td_key = (teacher, day)
            teacher_day_load[td_key] = teacher_day_load.get(td_key, 0) + 1

        # Teacher per-day overload penalty (soft)
        for (teacher, day), load in teacher_day_load.items():
            if load > 4:
                penalty += (load - 4) * 3

        # 5-SLOT PER DAY RULE (soft) — per division per day
        for (division, day), count in division_day_count.items():
            if count != TEACHING_PER_DAY:
                deviation = abs(count - TEACHING_PER_DAY)
                penalty += deviation * 5

        # Fitness calculation
        fitness = 100 - penalty
        if for_display:
            fitness = max(0, min(100, fitness))
        return fitness


def calculate_fitness(chromosome, break_map=None, room_types=None, subject_types=None):
    """Optimization-facing: raw 100 - penalty, may be negative for hard problems."""
    return FitnessCalculator(
        chromosome.genes, break_map, room_types, subject_types
    ).calculate(for_display=False)


def calculate_fitness_display(chromosome, break_map=None, room_types=None, subject_types=None):
    """User-facing: clamped to [0, 100] for reporting."""
    return FitnessCalculator(
        chromosome.genes, break_map, room_types, subject_types
    ).calculate(for_display=True)