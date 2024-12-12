// Google Classroom.gs

/**
 * Represents a single Google Classroom.
 */
class GoogleClassroom {
    /**
     * Constructor for GoogleClassroom.
     * @param {Object} courseData - Data representing the Google Classroom.
     */
    constructor(courseData) {
        this.id = courseData.id || null;
        this.name = courseData.name || '';
        this.ownerId = courseData.ownerId || '';
        this.teachers = courseData.teachers || [];
        this.enrollmentCode = courseData.enrollmentCode || '';
    }

    /**
     * Creates a new Google Classroom.
     */
    create() {
        const course = {
            name: this.name,
            ownerId: this.ownerId,
            courseState: 'ACTIVE'
        };
        const newCourse = Classroom.Courses.create(course);
        this.id = newCourse.id;
        this.enrollmentCode = newCourse.enrollmentCode;

        // Invite teachers except the owner
        this.teachers.forEach((email, index) => {
            if (index > 0) this.inviteTeacher(email); // Skip the first teacher (owner)
        });
    }

    /**
                this.inviteTeacher(email);
            }
        });
    }

    /**
     * Sends an invitation to a teacher.
     * @param {string} email - Email of the teacher to invite.
     */
    inviteTeacher(email) {
        try {
            Classroom.Invitations.create({ courseId: this.id, role: 'TEACHER', userId: email });
        } catch (error) {
            console.log(`Failed to invite teacher: ${email} to course: ${this.id}. Error: ${error.message}`);
        }
    }

    /**
     * Converts the Google Classroom data to a row for the sheet.
     * @return {Array} Row data for the Google Sheet.
     */
    toRow() {
        const teachers = this.teachers.slice(0, 4);
        return [this.id, this.name, ...teachers, this.enrollmentCode];
    }
}
  * Updates the Google Classroom with new details.
     * @param {string} name - The updated name of the classroom.
     * @param {string} ownerId - The updated owner ID.
     * @param {Array<string>} teachers - Updated list of teachers' emails.
     */
    update(name, ownerId, teachers) {
        this.name = name;
        this.ownerId = ownerId;
        this.teachers = teachers;

        const existingCourse = Classroom.Courses.get(this.id);
        if (existingCourse.name !== this.name || existingCourse.ownerId !== this.ownerId) {
            Classroom.Courses.update({ name: this.name, ownerId: this.ownerId }, this.id);
        }

        // Add missing teachers
        const currentTeachers = Classroom.Courses.Teachers.list(this.id).teachers || [];
        const currentEmails = currentTeachers.map(t => t.profile.emailAddress);

        this.teachers.forEach(email => {
            if (!currentEmails.includes(email)) {
                this.inviteTeacher(email);
            }
        });
    }

    /**
     * Sends an invitation to a teacher.
     * @param {string} email - Email of the teacher to invite.
     */
    inviteTeacher(email) {
        try {
            Classroom.Invitations.create({ courseId: this.id, role: 'TEACHER', userId: email });
        } catch (error) {
            console.log(`Failed to invite teacher: ${email} to course: ${this.id}. Error: ${error.message}`);
        }
    }

    /**
     * Converts the Google Classroom data to a row for the sheet.
     * @return {Array} Row data for the Google Sheet.
     */
    toRow() {
        const teachers = this.teachers.slice(0, 4);
        return [this.id, this.name, ...teachers, this.enrollmentCode];
    }
}
