const manifest = (() => {
    function __memo(fn) {
        let value;
        return () => value ?? (value = value = fn());
    }
    return {
        appDir: "_app",
        appPath: "_app",
        assets: new Set(["favicon.png"]),
        mimeTypes: { ".png": "image/png" },
        _: {
            client: { "start": "_app/immutable/entry/start.D_Uzo-f6.js", "app": "_app/immutable/entry/app.CYaeIRzu.js", "imports": ["_app/immutable/entry/start.D_Uzo-f6.js", "_app/immutable/chunks/entry.BhyUKcR0.js", "_app/immutable/chunks/runtime.BBEeCGXK.js", "_app/immutable/chunks/index-client.CrQYkjQT.js", "_app/immutable/entry/app.CYaeIRzu.js", "_app/immutable/chunks/runtime.BBEeCGXK.js", "_app/immutable/chunks/render.BpShDhos.js", "_app/immutable/chunks/disclose-version.BlsISTXH.js", "_app/immutable/chunks/if.CGyUfzrp.js", "_app/immutable/chunks/index-client.CrQYkjQT.js"], "stylesheets": [], "fonts": [], "uses_env_dynamic_public": false },
            nodes: [
                __memo(() => import('./chunks/0-jdYd-gt5.js')),
                __memo(() => import('./chunks/1-DPo8tVUc.js')),
                __memo(() => import('./chunks/2-DPfxWI5z.js'))
            ],
            routes: [
                {
                    id: "/",
                    pattern: /^\/$/,
                    params: [],
                    page: { layouts: [0,], errors: [1,], leaf: 2 },
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