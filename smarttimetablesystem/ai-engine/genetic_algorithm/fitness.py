TEACHING_PER_DAY = 5  # Target: 5 classes per day PER DIVISION


class FitnessCalculator:

    def __init__(self, genes, break_map=None):
        self.genes = genes
        self.break_map = break_map or {}

    def calculate(self):

        penalty = 0

        teacher_timeslot = {}
        room_timeslot = {}
        class_slot_used = {}  # keyed by (division, timeslot) — one division can't have two subjects in same slot

        teacher_day_load = {}

        # Track classes per (division, day) — each division should have TEACHING_PER_DAY classes/day
        division_day_count = {}

        for gene in self.genes:

            teacher = gene.teacherId
            room = gene.roomId
            timeslot = gene.timeslotId
            division = gene.division  # e.g. "CE-A", "IT-B"

            # -------------------------
            # Parse timeslot
            # -------------------------
            try:
                day, slot = timeslot.split("-")
                slot_number = int(slot)
            except Exception:
                day = "UNKNOWN"
                slot_number = 0
                penalty += 5

            # -------------------------
            # BREAK SLOT VIOLATION
            # -------------------------
            if day in self.break_map and slot_number == self.break_map[day]:
                penalty += 15

            # -------------------------
            # Track division-day count (per-division, not global)
            # -------------------------
            dd_key = (division, day)
            division_day_count[dd_key] = division_day_count.get(dd_key, 0) + 1

            # -------------------------
            # Teacher conflict (same teacher, same timeslot — regardless of division)
            # -------------------------
            key = (teacher, timeslot)
            if key in teacher_timeslot:
                penalty += 10
            else:
                teacher_timeslot[key] = True

            # -------------------------
            # Room conflict (same room, same timeslot — regardless of division)
            # -------------------------
            key = (room, timeslot)
            if key in room_timeslot:
                penalty += 10
            else:
                room_timeslot[key] = True

            # -------------------------
            # Class-slot collision (same division, same timeslot)
            # Different divisions CAN share a timeslot (in different rooms with different teachers).
            # Same division CANNOT have two subjects in the same timeslot.
            # -------------------------
            cs_key = (division, timeslot)
            if cs_key in class_slot_used:
                penalty += 15
            else:
                class_slot_used[cs_key] = True

            # -------------------------
            # Teacher per-day load tracking (across all divisions)
            # -------------------------
            td_key = (teacher, day)
            teacher_day_load[td_key] = teacher_day_load.get(td_key, 0) + 1

        # -------------------------
        # Teacher per-day overload penalty (soft)
        # -------------------------
        for (teacher, day), load in teacher_day_load.items():
            if load > 4:
                penalty += (load - 4) * 3

        # -------------------------
        # 5-SLOT PER DAY RULE (soft) — per division per day
        # -------------------------
        for (division, day), count in division_day_count.items():
            if count != TEACHING_PER_DAY:
                deviation = abs(count - TEACHING_PER_DAY)
                penalty += deviation * 5

        # -------------------------
        # Fitness calculation
        # -------------------------
        fitness = 100 - penalty

        if fitness < 0:
            fitness = 0
        if fitness > 100:
            fitness = 100

        return fitness


# -------------------------------------------------
# Wrapper
# -------------------------------------------------
def calculate_fitness(chromosome, break_map=None):
    calculator = FitnessCalculator(chromosome.genes, break_map)
    return calculator.calculate()