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
    let quizzes: Quiz[] = $state([])
    async function getQuizzes() {
    try {
        const response = await fetch('/getQuizzesByStudent');
        if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const quizData = await response.json();
        return !('error' in quizData) ? quizData : null;
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        throw new Error('Failed to fetch quizzes' );
    }
    }

    onMount(async () => {
        quizzes = await getQuizzes();
        console.log(quizzes);
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

{#each quizzes as quiz, i}
    <button onclick={() => quizRedirect(quiz.id)}>{quiz.name}</button>
    {formatCloseAt(quiz.closeAt)}
{/each}



<Footer />