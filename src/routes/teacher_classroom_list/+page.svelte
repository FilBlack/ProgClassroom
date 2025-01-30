<script lang="ts">
    import Header from "../../lib/Header.svelte"
    import Footer from "../../lib/Footer.svelte"

    interface Classroom {
        id: number;
        name: string;
        studentsCount: number;
    }

    async function fetchClassroomsByTeacher(teacherId: number): Promise<Classroom[] | { error: string }> {
    try {
        const response = await fetch(`/getClassroomsByTeacher?teacherId=${teacherId}`);

        if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        return { error: 'Failed to fetch classrooms' };
    }
    }


    // fetchClassroomsByTeacher(teacherId)
    // .then((data) => {
    //     if ('error' in data) {
    //     console.error('Error:', data.error);
    //     } else {




    //     }
    // })
    // .catch((err) => console.error('Unexpected error:', err));
</script>
<Header />





<Footer />