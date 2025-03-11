const manifest = (() => {
    function __memo(fn) {
        let value;
        return () => value ?? (value = value = fn());
    }
    return {
        appDir: "_app",
        appPath: "_app",
        assets: new Set(["favicon.svg", "favicon_old.png", "logo-logo.png", "ProgClass_logo.png"]),
        mimeTypes: { ".svg": "image/svg+xml", ".png": "image/png" },
        _: {
            client: { "start": "_app/immutable/entry/start.Dc9nNA25.js", "app": "_app/immutable/entry/app.fxN6pruk.js", "imports": ["_app/immutable/entry/start.Dc9nNA25.js", "_app/immutable/chunks/entry.DQNk4Ex5.js", "_app/immutable/chunks/runtime.B5v160g9.js", "_app/immutable/chunks/index-client.B0Nc2heB.js", "_app/immutable/entry/app.fxN6pruk.js", "_app/immutable/chunks/runtime.B5v160g9.js", "_app/immutable/chunks/render.BuiQ5Btp.js", "_app/immutable/chunks/events.JxbHtVRD.js", "_app/immutable/chunks/disclose-version.n4I21__E.js", "_app/immutable/chunks/props.BYGq1WIC.js", "_app/immutable/chunks/this.DNBh5HYI.js", "_app/immutable/chunks/index-client.B0Nc2heB.js"], "stylesheets": [], "fonts": [], "uses_env_dynamic_public": false },
            nodes: [
                __memo(() => import('./chunks/0-B0SOGKhz.js')),
                __memo(() => import('./chunks/1-DXWc6tio.js')),
                __memo(() => import('./chunks/2-DtQuBOAM.js')),
                __memo(() => import('./chunks/3-BoYZwLZF.js')),
                __memo(() => import('./chunks/4-BTnnraxx.js')),
                __memo(() => import('./chunks/5-CvW9dIkY.js')),
                __memo(() => import('./chunks/6-BBbpBvd9.js')),
                __memo(() => import('./chunks/7-B3P79mv3.js')),
                __memo(() => import('./chunks/8-Di4k1jlC.js')),
                __memo(() => import('./chunks/9-CUbY55Vm.js')),
                __memo(() => import('./chunks/10-CRY210cF.js'))
            ],
            routes: [
                {
                    id: "/",
                    pattern: /^\/$/,
                    params: [],
                    page: { layouts: [0,], errors: [1,], leaf: 2 },
                    endpoint: null
                },
                {
                    id: "/forbidden",
                    pattern: /^\/forbidden\/?$/,
                    params: [],
                    page: { layouts: [0,], errors: [1,], leaf: 3 },
                    endpoint: null
                },
                {
                    id: "/student_classroom_list",
                    pattern: /^\/student_classroom_list\/?$/,
                    params: [],
                    page: { layouts: [0,], errors: [1,], leaf: 5 },
                    endpoint: null
                },
                {
                    id: "/student_classroom",
                    pattern: /^\/student_classroom\/?$/,
                    params: [],
                    page: { layouts: [0,], errors: [1,], leaf: 4 },
                    endpoint: null
                },
                {
                    id: "/student_quiz",
                    pattern: /^\/student_quiz\/?$/,
                    params: [],
                    page: { layouts: [0,], errors: [1,], leaf: 6 },
                    endpoint: null
                },
                {
                    id: "/teacher_classroom_list",
                    pattern: /^\/teacher_classroom_list\/?$/,
                    params: [],
                    page: { layouts: [0,], errors: [1,], leaf: 8 },
                    endpoint: null
                },
                {
                    id: "/teacher_classroom_quiz",
                    pattern: /^\/teacher_classroom_quiz\/?$/,
                    params: [],
                    page: { layouts: [0,], errors: [1,], leaf: 9 },
                    endpoint: null
                },
                {
                    id: "/teacher_classroom",
                    pattern: /^\/teacher_classroom\/?$/,
                    params: [],
                    page: { layouts: [0,], errors: [1,], leaf: 7 },
                    endpoint: null
                },
                {
                    id: "/teacher_quiz",
                    pattern: /^\/teacher_quiz\/?$/,
                    params: [],
                    page: { layouts: [0,], errors: [1,], leaf: 10 },
                    endpoint: null
                }
            ],
            matchers: async () => {
                return {};
            },
            server_assets: {}
        }
    };
})();
const prerendered = new Set([]);
const base = "";
export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
//# sourceMappingURL=manifest.js.map