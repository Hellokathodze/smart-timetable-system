class Gene:

    def __init__(self, subjectId, teacherId, roomId, timeslotId, branch, division):

        self.subjectId = subjectId
        self.teacherId = teacherId
        self.roomId = roomId
        self.timeslotId = timeslotId
        self.branch = branch
        self.division = division

    def to_dict(self):
        return {
            "subjectId": self.subjectId,
            "teacherId": self.teacherId,
            "roomId": self.roomId,
            "timeslotId": self.timeslotId,
            "branch": self.branch,
            "division": self.division
        }