from ml.predictor import predict_demand

TEACHING_PER_DAY = 5  # Target: 5 classes per day


class FitnessCalculator:

    def __init__(self, genes, break_map=None):
        self.genes = genes
        self.break_map = break_map or {}

    def calculate(self):

        penalty = 0
        reward = 0

        teacher_timeslot = {}
        room_timeslot = {}
        slot_used = {}  # track which timeslots are used (for division conflicts)

        teacher_day_load = {}

        # ✅ Track classes per DAY (single group — all subjects go to CE_A)
        day_count = {}

        for gene in self.genes:

            teacher = gene.teacherId
            room = gene.roomId
            timeslot = gene.timeslotId

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
            # Track day count (all subjects = one group)
            # -------------------------
            day_count[day] = day_count.get(day, 0) + 1

            # -------------------------
            # Teacher conflict (same teacher, same timeslot)
            # -------------------------
            key = (teacher, timeslot)
            if key in teacher_timeslot:
                penalty += 10
            else:
                teacher_timeslot[key] = True

            # -------------------------
            # Room conflict
            # -------------------------
            key = (room, timeslot)
            if key in room_timeslot:
                penalty += 10
            else:
                room_timeslot[key] = True

            # -------------------------
            # Timeslot collision (two subjects in same slot)
            # Since all subjects go to one class (CE division A),
            # no two subjects can occupy the same timeslot
            # -------------------------
            if timeslot in slot_used:
                penalty += 15
            else:
                slot_used[timeslot] = True

            # -------------------------
            # Teacher per-day load tracking
            # -------------------------
            td_key = (teacher, day)
            teacher_day_load[td_key] = teacher_day_load.get(td_key, 0) + 1

            # -------------------------
            # ML Demand Prediction (reward only)
            # -------------------------
            try:
                prediction = predict_demand(
                    timeslot=slot_number,
                    teacher_load=teacher_day_load.get(td_key, 1),
                    room_utilization=0.7
                )
                if prediction == 1:
                    reward += 1
            except Exception:
                pass

        # -------------------------
        # Teacher per-day overload penalty
        # -------------------------
        for (teacher, day), load in teacher_day_load.items():
            if load > 4:
                penalty += (load - 4) * 3

        # -------------------------
        # 5-SLOT PER DAY RULE (soft)
        # All subjects are one group — check total classes per day
        # -------------------------
        for day, count in day_count.items():
            if count != TEACHING_PER_DAY:
                deviation = abs(count - TEACHING_PER_DAY)
                penalty += deviation * 5

        # -------------------------
        # Fitness calculation
        # -------------------------
        fitness = 100 - penalty + reward

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