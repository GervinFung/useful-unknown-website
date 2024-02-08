import { defineConfig } from 'vite';

export default defineConfig(() => {
	const root = process.cwd();

	const server = {
		port: 3000,
		open: false,
		strictPort: true,
	} as const;

	return {
		root: `${root}/src`,
		server,
		preview: server,
		envDir: root,
		build: {
			emptyOutDir: true,
			outDir: `${root}/build`,
		},
	};
});
