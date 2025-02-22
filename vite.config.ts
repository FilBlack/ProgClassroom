import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const config = defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
		  '^/(auth/google(\\/callback)?|getClassroomsByTeacher|getClassroomsByStudent|getStudentsByClassroom|addStudentsToClassroom|removeStudentFromClassroom|getQuizzesByStudentAndClassroom|getQuizStudentConnection|getQuizStudentConnectionsByQuizIds|getQuizStudentConnectionsByStudentEmails|getQuizById|submitQuizAnswer|unsubmitQuizAnswer|submitQuizComment|unsubmitQuizComment|addClassroom|removeClassroom|getQuizesByClassroom|addQuizToClassroom|removeQuiz|closeQuiz)': {
			target: 'http://localhost:3000',
			changeOrigin: true,
			rewrite: path => path,
			configure: (proxy, _options) => {
				proxy.on('error', (err, _req, _res) => {
				  console.log('proxy error', err);
				});
				proxy.on('proxyReq', (proxyReq, req, _res) => {
				  console.log('Sending Request to the Target:', req.method, req.url);
				});
				proxy.on('proxyRes', (proxyRes, req, _res) => {
				  console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
				});
			  },
		  }
		}
	},
	resolve: {
		extensions: ['.svelte', 'svelte.ts', '.js', 'svelte.js']
	  },
	optimizeDeps: {
        exclude: ["svelte-codemirror-editor", "codemirror", "@codemirror/language-javascript"],
    },
	ssr: {
		noExternal: ['svelte-codemirror-editor']
	}
	  
});

export default config