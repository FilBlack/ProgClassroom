<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"
    import { onMount } from 'svelte'

    // Define the neccessary interfaces for typescript
    interface Quiz {
        id:number;
        f_classroom_id: number;
        name: string;
        question: string;
        open: boolean;
        closeAt: string;
        type: 'plaintext' | 'code';
    }

    interface StudentQuiz {
        id: number;
        f_student_email: string;
        f_quiz_id: number;
        answer: string | null;
        answered: boolean;
        points: number | null;
    }

    interface Student {
        id: number;
        googleId: string;
        name: string;
        email: string;
        profilePicture: string | null;
        position: string;
        isPending: boolean;
    }

    // Get a list of all the data for each student that has the quiz assigned
    async function getCombinedStudentsQuizzes(): Promise<(Student & StudentQuiz)[]> {
        try {
            const currentQuiz: string = sessionStorage.getItem('currentQuiz')
            const currentClassroom: string = sessionStorage.getItem('currentClassroom')
            // Get all the students in the current classroom 
            const studentResponse: Response = await fetch(`/getStudentsByClassroom?classroomId=${currentClassroom}`);
            if (!studentResponse.ok) {
                throw new Error(`Error: ${studentResponse.status} ${studentResponse.statusText}`);
            }
            const studentData: Student[] = await studentResponse.json();
            // Map app the students to their corresponding email
            const studentEmails: string[]  = studentData.map(quiz => quiz.email)
            // Get the needed quiz connection for each student by their email
            const connectionResponse: Response = await fetch(`/getQuizStudentConnectionsByStudentEmails?studentEmails=${studentEmails.join(',')}&quizId=${currentQuiz}`)
            const connectionData: StudentQuiz[] = await connectionResponse.json()
            // Combine the quiz and connection into one for easier use 
            const combinedData: (Student & StudentQuiz)[] = studentData.map((student, index) => {
                return {...student, ...connectionData[index]}
            })
            return combinedData
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            throw new Error('Failed to fetch quizzes' );
        }
    }

    // Redirect the teacher to the students answer for that particular quiz
    function teacherQuizRedirect(studentQuiz:(Student & StudentQuiz)): void {
        sessionStorage.setItem('currentStudentEmail', String(studentQuiz.email));
        window.location.href = 'teacher_quiz'
    }

    // Data store for all the quiz and connection data for each student
    let combinedStudents: (Student & StudentQuiz)[]
    // After the components are mounted, update the store with the data 
    onMount(async () => {
        combinedStudents = await getCombinedStudentsQuizzes();
    });
</script>
<Header
classroomRedirect="/teacher_classroom_list"
>
</Header>


<div class="student_wrapper">
    <div id="students_tag">Students</div>
    <div id="submitted_tag">Submitted</div>
</div>
<div id="studentlist">
    {#each combinedStudents as studentQuiz,i}
        <div class=student_wrapper>
            <button class="student" onclick={() => teacherQuizRedirect(studentQuiz)}>{studentQuiz.name}</button>
            <div class="submitted">
                {#if studentQuiz.answered}
                    Answered
                {:else}
                    Unanswered
                {/if}
            </div>
        </div>
    {/each}
</div>


<Footer />

<style>
    #studentlist {
        display: flex;
        flex-direction: column;
        margin-left: 2em;
    }
    #students_tag {
        font-size: 30px;
        margin-left: 1em;
        width: 10rem;
        margin-right: 4em;

    }
    #submitted_tag {
        font-size: 30px;
        margin-left: 1em;
    }
    .student_wrapper {
        display: flex;
        flex-direction: row;
        margin-bottom: 0.5em;
    }

    .student {
        width: 10em;
        margin-right: 4em;
        text-align: center;
        border: 1px solid rgb(0,0,0,0.2);
        border-radius: 10px;
        box-sizing: content-box;
        box-shadow: 3px 2px 10px -2px rgba(0, 0, 0, 0.34);
    }

    .student:active {
        transform: scale(0.98);
        box-shadow: 2px 1px 5px 1px rgba(0, 0, 0, 0.14);
    }

    .student:hover {
        border: 1px solid rgba(0, 0, 255, 0.2);
        color: blue;
    }

</style>