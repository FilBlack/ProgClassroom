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


    let combinedQuizzes: (Quiz & StudentQuiz)[] = $state([])
    async function getQuizzes() {
        try {
            const currentClassroom :string = sessionStorage.getItem('currentClassroom')
            const response = await fetch(`/getQuizzesByStudentAndClassroom?currentClassroom=${currentClassroom}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            const quizData: Quiz[] = await response.json();
            const quizIds: number[]  = quizData.map(quiz => quiz.id)
            // Get the needed student connection for each quiz 
            const response2 = await fetch(`getQuizStudentConnectionsByQuizIds?quizIds=${quizIds.join(',')}`)
            const connectionData: StudentQuiz[] = await response2.json()
            // Combine the quiz and connection into one for easier use 
            const combinedData: (Quiz & StudentQuiz)[] = quizData.map((quiz, index) => {
                return {...quiz, ...connectionData[index]}
            })
            return combinedData
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            throw new Error('Failed to fetch quizzes' );
        }
    }

    onMount(async () => {
        combinedQuizzes = await getQuizzes();
        console.log(combinedQuizzes);
    });
    
    function quizRedirect(quiz_id: number) {
        sessionStorage.setItem('currentQuiz', String(quiz_id));
        window.location.href = 'student_quiz'
    }

    function formatCloseAt(ISO: string): string {
        const date = new Date(ISO);
        
        // Check if the ISO string is a valid date
        if (isNaN(date.getTime())) {
            return "Invalid date";
        }

        // "Month Day, Year, Hour:Minute AM/PM"
        return date.toLocaleString("cs-CZ", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        });
    }

</script>
<Header />

{#each combinedQuizzes as quiz, i}
    <button onclick={() => quizRedirect(quiz.id)}>{quiz.name}</button>
    {#if quiz.answered}
        Submitted
    {:else}
        Not submitted
    {/if}
    {#if quiz.open}
        {formatCloseAt(quiz.closeAt)}
    {:else}
        Closed
    {/if}
{/each}



<Footer />