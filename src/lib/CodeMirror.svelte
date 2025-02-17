<!-- The code below is released under public domain. -->

<script context="module">
    import { EditorView, minimalSetup, basicSetup } from 'codemirror'
    // import { ViewPlugin } from '@codemirror/view'
    import { StateEffect } from '@codemirror/state'
    export { minimalSetup, basicSetup }
    </script>
    
    <script>
    import { onMount, onDestroy, createEventDispatcher } from 'svelte'
    const dispatch = createEventDispatcher()
    
    let dom

  let _mounted = false
  onMount(() => {
    _mounted = true
    return () => { _mounted = false }
  })

  export let view = null

  // The initial document (non-reactive).
  export let doc

  // Optionally listen to transactions.
  export let verbose = false

  let _docCached = null

  function _setText(text) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: text },
    })
  }

  const subscribers = new Set()
  export const docStore = {
    ready: () => (view !== null),
    subscribe(cb) {
      subscribers.add(cb)
      if (!this.ready()) {
        cb(null)
      } else {
        if (_docCached == null) {
          _docCached = view.state.doc.toString()
        }
        cb(_docCached)
      }
      return () => void subscribers.delete(cb)
    },
    set(newValue) {
      if (!_mounted) {
        throw new Error('Cannot set docStore when the component is not mounted.')
      }
      const inited = _initEditorView(newValue)
      if (!inited) _setText(newValue)
    },
  }

  // Base extensions provided from outside; default to minimalSetup.
  export let extensions = minimalSetup

  // Export a "disabled" prop.
  export let disabled = false

  // Create a unique tag for the editable extension.
  const editableTag = Symbol("editable")

  // Helper to tag an extension.
  function tagExtension(tag, extension) {
    extension.tag = tag
    return extension
  }

  // When the editor is first created, include our tagged editable extension.
  // We initialize it with EditorView.editable.of(!disabled) so that if disabled is true,
  // the editor is read-only.
  $: initialExtensions = [
    ...extensions,
    tagExtension(editableTag, EditorView.editable.of(!disabled))
  ]

  // In our _initEditorView, use the initialExtensions.
  function _initEditorView(initialDoc) {
    if (view !== null) return false

    view = new EditorView({
      doc: initialDoc,
      extensions: initialExtensions,
      parent: dom,
      dispatchTransactions: _editorTxHandler,
    })
    return true
  }

  function _reconfigureExtensions() {
    if (view === null) return
    // Use a reconfiguration effect keyed by our editableTag.
    view.dispatch({
      effects: StateEffect.reconfigure.of({
        [editableTag]: EditorView.editable.of(!disabled)
      }),
    })
  }

//   // Watch for changes to "extensions" (or any external change) and reconfigure.
//   $: extensions, _reconfigureExtensions()

  // Additionally, update the editable extension when "disabled" changes.
  $: disabled, _reconfigureExtensions(), console.log("disabled:", disabled)

  function _editorTxHandler(trs, view) {
    view.update(trs)
    if (verbose) {
      dispatch('update', trs)
    }
    let lastChangingTr
    if (lastChangingTr = trs.findLast(tr => tr.docChanged)) {
      _docCached = null
      if (subscribers.size) {
        dispatchDocStore(_docCached = lastChangingTr.newDoc.toString())
      }
      dispatch('change', { view, trs })
    }
  }

  function dispatchDocStore(s) {
    for (const cb of subscribers) {
      cb(s)
    }
  }

  $: if (_mounted && doc !== undefined) {
    const inited = _initEditorView(doc)
    dispatchDocStore(doc)
  }

  onDestroy(() => {
    if (view !== null) {
      view.destroy()
    }
  })
    </script>
    
    <div class="codemirror" bind:this={dom}>
    </div>
    
    <style>
    .codemirror {
      display: contents;
    }
    </style>
    