<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"
    import { onMount } from 'svelte'

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

    async function getCombinedStudentsQuizzes() {
        try {
            const currentQuiz :string = sessionStorage.getItem('currentQuiz')
            const currentClassroom :string = sessionStorage.getItem('currentClassroom')
            const studentResponse = await fetch(`/getStudentsByClassroom?classroomId=${currentClassroom}`);
            if (!studentResponse.ok) {
                throw new Error(`Error: ${studentResponse.status} ${studentResponse.statusText}`);
            }
            const studentData: Student[] = await studentResponse.json();
            const studentEmails: string[]  = studentData.map(quiz => quiz.email)
            // Get the needed quiz connection for each student  
            const connectionResponse = await fetch(`/getQuizStudentConnectionsByStudentEmails?studentEmails=${studentEmails.join(',')}&quizId=${currentQuiz}`)
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

    function teacherQuizRedirect(studentQuiz:(Student & StudentQuiz)) {
        sessionStorage.setItem('currentStudentEmail', String(studentQuiz.email));
        window.location.href = 'teacher_quiz'
    }


    let combinedStudents: (Student & StudentQuiz)[]
    onMount(async () => {
        combinedStudents = await getCombinedStudentsQuizzes();
        console.log(combinedStudents);
    });
</script>
<Header
classroomRedirect="/teacher_classroom_list"
>
</Header>




{#each combinedStudents as studentQuiz,i}
    <button onclick={() => teacherQuizRedirect(studentQuiz)}>{studentQuiz.name}</button>
    {#if studentQuiz.answered}
        Answered
    {:else}
        Unanswered
    {/if}

{/each}


<Footer />