
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* 
     * Courtesy of https://lwkchan.com/blog/lazy-loading-images-in-svelte-3/
     */

    function lazyLoad(node, src) {
        if (IntersectionObserver) {
          const observer = new IntersectionObserver(onIntersect, {
            // If the image gets within 50px in the Y axis, start the download.
            rootMargin: '50px 0px',
            threshold: 0.01
          });
      
          function onIntersect(entries) {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                node.setAttribute('src', src);
              }
            });
          }
      
          observer.observe(node);
          return {
            destroy() {
              observer && observer.unobserve(node);
            }
          };
        } else {
          // fallback
          let lazyLoadThrottleTimeout = undefined;
      
          function polyfillLazyLoad() {
            if (lazyLoadThrottleTimeout) {
              clearTimeout(lazyLoadThrottleTimeout);
            }
      
            lazyLoadThrottleTimeout = setTimeout(function() {
              var scrollTop = window.pageYOffset;
              if (node.offsetTop < window.innerHeight + scrollTop) {
                node.setAttribute('src', src);
              }
            }, 20);
          }
          document.addEventListener('scroll', polyfillLazyLoad);
          window.addEventListener('resize', polyfillLazyLoad);
          window.addEventListener('orientationChange', polyfillLazyLoad);
          return {
            destroy() {
              document.removeEventListener('scroll', polyfillLazyLoad);
              window.removeEventListener('resize', polyfillLazyLoad);
              window.removeEventListener('orientationChange', polyfillLazyLoad);
            }
          };
        }
      }

    /* src/Match.svelte generated by Svelte v3.29.4 */

    const { Object: Object_1 } = globals;
    const file = "src/Match.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (26:4) {#each Object.keys(match.confidences) as c}
    function create_each_block(ctx) {
    	let p;
    	let t0_value = /*c*/ ctx[1] + "";
    	let t0;
    	let br;
    	let t1_value = format(/*match*/ ctx[0].confidences[/*c*/ ctx[1]]) + "";
    	let t1;
    	let t2;
    	let p_class_value;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			br = element("br");
    			t1 = text(t1_value);
    			t2 = space();
    			add_location(br, file, 27, 11, 769);
    			attr_dev(p, "class", p_class_value = "card-footer-item " + background(/*match*/ ctx[0].confidences[/*c*/ ctx[1]]));
    			add_location(p, file, 26, 6, 694);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, br);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1 && t0_value !== (t0_value = /*c*/ ctx[1] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*match*/ 1 && t1_value !== (t1_value = format(/*match*/ ctx[0].confidences[/*c*/ ctx[1]]) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*match*/ 1 && p_class_value !== (p_class_value = "card-footer-item " + background(/*match*/ ctx[0].confidences[/*c*/ ctx[1]]))) {
    				attr_dev(p, "class", p_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(26:4) {#each Object.keys(match.confidences) as c}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div4;
    	let div1;
    	let div0;
    	let t0_value = /*match*/ ctx[0].image + "";
    	let t0;
    	let t1;
    	let div2;
    	let figure;
    	let img;
    	let img_alt_value;
    	let lazyLoad_action;
    	let t2;
    	let div3;
    	let mounted;
    	let dispose;
    	let each_value = Object.keys(/*match*/ ctx[0].confidences);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div2 = element("div");
    			figure = element("figure");
    			img = element("img");
    			t2 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "card-header-title");
    			add_location(div0, file, 17, 4, 376);
    			attr_dev(div1, "class", "card-header");
    			add_location(div1, file, 16, 2, 346);
    			attr_dev(img, "alt", img_alt_value = /*match*/ ctx[0].image);
    			add_location(img, file, 21, 6, 506);
    			attr_dev(figure, "class", "image is-square");
    			add_location(figure, file, 20, 4, 467);
    			attr_dev(div2, "class", "card-image");
    			add_location(div2, file, 19, 2, 438);
    			attr_dev(div3, "class", "card-footer has-text-centered");
    			add_location(div3, file, 24, 2, 596);
    			attr_dev(div4, "class", "card");
    			add_location(div4, file, 15, 0, 325);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, figure);
    			append_dev(figure, img);
    			append_dev(div4, t2);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			if (!mounted) {
    				dispose = action_destroyer(lazyLoad_action = lazyLoad.call(null, img, "images/" + /*match*/ ctx[0].image));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*match*/ 1 && t0_value !== (t0_value = /*match*/ ctx[0].image + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*match*/ 1 && img_alt_value !== (img_alt_value = /*match*/ ctx[0].image)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (lazyLoad_action && is_function(lazyLoad_action.update) && dirty & /*match*/ 1) lazyLoad_action.update.call(null, "images/" + /*match*/ ctx[0].image);

    			if (dirty & /*background, match, Object, format*/ 1) {
    				each_value = Object.keys(/*match*/ ctx[0].confidences);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function format(confidence) {
    	if (confidence == 1 || confidence == 0) return confidence;
    	return confidence.toFixed(3);
    }

    function background(confidence) {
    	if (confidence == 1) return "has-background-success";
    	return "";
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Match", slots, []);
    	let { match } = $$props;
    	const writable_props = ["match"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Match> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("match" in $$props) $$invalidate(0, match = $$props.match);
    	};

    	$$self.$capture_state = () => ({ lazyLoad, match, format, background });

    	$$self.$inject_state = $$props => {
    		if ("match" in $$props) $$invalidate(0, match = $$props.match);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [match];
    }

    class Match extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { match: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Match",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*match*/ ctx[0] === undefined && !("match" in props)) {
    			console.warn("<Match> was created without expected prop 'match'");
    		}
    	}

    	get match() {
    		throw new Error("<Match>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set match(value) {
    		throw new Error("<Match>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Classification.svelte generated by Svelte v3.29.4 */
    const file$1 = "src/Classification.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (32:4) {#each matchesList as m}
    function create_each_block$1(ctx) {
    	let match;
    	let current;

    	match = new Match({
    			props: { match: /*m*/ ctx[6] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(match.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(match, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const match_changes = {};
    			if (dirty & /*matchesList*/ 16) match_changes.match = /*m*/ ctx[6];
    			match.$set(match_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(match.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(match.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(match, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(32:4) {#each matchesList as m}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let p;
    	let span0;
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*matches*/ ctx[1].length + "";
    	let t2;
    	let t3;
    	let span2;
    	let t4_value = /*uncertainMatches*/ ctx[3].length + "";
    	let t4;
    	let t5;
    	let br;
    	let t6;
    	let label;
    	let input;
    	let t7;
    	let t8;
    	let div0;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*matchesList*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			p = element("p");
    			span0 = element("span");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			span2 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			br = element("br");
    			t6 = space();
    			label = element("label");
    			input = element("input");
    			t7 = text("\n      exclude full confidences");
    			t8 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span0, "class", "title");
    			add_location(span0, file$1, 21, 4, 420);
    			attr_dev(span1, "class", "tag is-info");
    			add_location(span1, file$1, 22, 4, 458);
    			attr_dev(span2, "class", "tag is-warning");
    			add_location(span2, file$1, 23, 4, 512);
    			add_location(br, file$1, 24, 4, 578);
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$1, 26, 6, 619);
    			attr_dev(label, "class", "checkbox");
    			add_location(label, file$1, 25, 4, 588);
    			attr_dev(p, "class", "has-text-centered");
    			add_location(p, file$1, 20, 2, 386);
    			attr_dev(div0, "class", "match-list svelte-7373i7");
    			add_location(div0, file$1, 30, 2, 735);
    			attr_dev(div1, "class", "box");
    			add_location(div1, file$1, 19, 0, 366);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p);
    			append_dev(p, span0);
    			append_dev(span0, t0);
    			append_dev(p, t1);
    			append_dev(p, span1);
    			append_dev(span1, t2);
    			append_dev(p, t3);
    			append_dev(p, span2);
    			append_dev(span2, t4);
    			append_dev(p, t5);
    			append_dev(p, br);
    			append_dev(p, t6);
    			append_dev(p, label);
    			append_dev(label, input);
    			input.checked = /*excludeFullConfidence*/ ctx[2];
    			append_dev(label, t7);
    			append_dev(div1, t8);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[5]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 1) set_data_dev(t0, /*name*/ ctx[0]);
    			if ((!current || dirty & /*matches*/ 2) && t2_value !== (t2_value = /*matches*/ ctx[1].length + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*uncertainMatches*/ 8) && t4_value !== (t4_value = /*uncertainMatches*/ ctx[3].length + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*excludeFullConfidence*/ 4) {
    				input.checked = /*excludeFullConfidence*/ ctx[2];
    			}

    			if (dirty & /*matchesList*/ 16) {
    				each_value = /*matchesList*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Classification", slots, []);
    	let { name } = $$props;
    	let { matches = [] } = $$props;
    	let excludeFullConfidence = false;
    	const writable_props = ["name", "matches"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Classification> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		excludeFullConfidence = this.checked;
    		$$invalidate(2, excludeFullConfidence);
    	}

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("matches" in $$props) $$invalidate(1, matches = $$props.matches);
    	};

    	$$self.$capture_state = () => ({
    		Match,
    		name,
    		matches,
    		excludeFullConfidence,
    		uncertainMatches,
    		matchesList
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("matches" in $$props) $$invalidate(1, matches = $$props.matches);
    		if ("excludeFullConfidence" in $$props) $$invalidate(2, excludeFullConfidence = $$props.excludeFullConfidence);
    		if ("uncertainMatches" in $$props) $$invalidate(3, uncertainMatches = $$props.uncertainMatches);
    		if ("matchesList" in $$props) $$invalidate(4, matchesList = $$props.matchesList);
    	};

    	let uncertainMatches;
    	let matchesList;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*matches, name*/ 3) {
    			 $$invalidate(3, uncertainMatches = matches.filter(m => m.confidences[name] < 1));
    		}

    		if ($$self.$$.dirty & /*excludeFullConfidence, uncertainMatches, matches*/ 14) {
    			 $$invalidate(4, matchesList = excludeFullConfidence ? uncertainMatches : matches);
    		}
    	};

    	return [
    		name,
    		matches,
    		excludeFullConfidence,
    		uncertainMatches,
    		matchesList,
    		input_change_handler
    	];
    }

    class Classification extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 0, matches: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Classification",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<Classification> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<Classification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Classification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get matches() {
    		throw new Error("<Classification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set matches(value) {
    		throw new Error("<Classification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ResultsFileLoader.svelte generated by Svelte v3.29.4 */
    const file$2 = "src/ResultsFileLoader.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let p;
    	let t1;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Load results file  ";
    			t1 = space();
    			input = element("input");
    			attr_dev(p, "class", "subtitle");
    			add_location(p, file$2, 16, 2, 373);
    			attr_dev(input, "type", "file");
    			attr_dev(input, "id", "results-file-input");
    			add_location(input, file$2, 17, 2, 424);
    			attr_dev(div, "class", "notification is-info is-light has-text-centered");
    			add_location(div, file$2, 15, 0, 309);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(div, t1);
    			append_dev(div, input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[2]),
    					listen_dev(input, "change", /*openFile*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ResultsFileLoader", slots, []);
    	const dispatch = createEventDispatcher();
    	let files;

    	function openFile() {
    		files[0].text().then(text => {
    			dispatch("resultsLoaded", {
    				file: files[0].name,
    				results: JSON.parse(text)
    			});
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ResultsFileLoader> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		files = this.files;
    		$$invalidate(0, files);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		files,
    		openFile
    	});

    	$$self.$inject_state = $$props => {
    		if ("files" in $$props) $$invalidate(0, files = $$props.files);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [files, openFile, input_change_handler];
    }

    class ResultsFileLoader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ResultsFileLoader",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/ManifestLoader.svelte generated by Svelte v3.29.4 */
    const file$3 = "src/ManifestLoader.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let p;
    	let t1;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Load manifest file  ";
    			t1 = space();
    			input = element("input");
    			attr_dev(p, "class", "subtitle");
    			add_location(p, file$3, 16, 4, 407);
    			attr_dev(input, "type", "file");
    			attr_dev(input, "id", "results-file-input");
    			add_location(input, file$3, 17, 4, 461);
    			attr_dev(div, "class", "notification is-info is-light has-text-centered");
    			add_location(div, file$3, 15, 2, 341);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(div, t1);
    			append_dev(div, input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[2]),
    					listen_dev(input, "change", /*openFile*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ManifestLoader", slots, []);
    	const dispatch = createEventDispatcher();
    	let files;

    	function openFile() {
    		files[0].text().then(text => {
    			dispatch("manifestLoaded", {
    				file: files[0].name,
    				manifest: JSON.parse(text)
    			});
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ManifestLoader> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		files = this.files;
    		$$invalidate(0, files);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		files,
    		openFile
    	});

    	$$self.$inject_state = $$props => {
    		if ("files" in $$props) $$invalidate(0, files = $$props.files);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [files, openFile, input_change_handler];
    }

    class ManifestLoader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ManifestLoader",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Manifest.svelte generated by Svelte v3.29.4 */

    const file$4 = "src/Manifest.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (36:4) {#each manifest.classifications as c}
    function create_each_block$2(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*c*/ ctx[4] + "";
    	let t0;
    	let t1;
    	let span;
    	let t2_value = /*training_images_for*/ ctx[2](/*c*/ ctx[4]) + "";
    	let t2;
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = text(" images");
    			t4 = space();
    			attr_dev(span, "class", "tag is-primary");
    			add_location(span, file$4, 39, 10, 1023);
    			attr_dev(div0, "class", "subtitle");
    			add_location(div0, file$4, 37, 8, 976);
    			attr_dev(div1, "class", "column");
    			add_location(div1, file$4, 36, 6, 947);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, span);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(div1, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*manifest*/ 1 && t0_value !== (t0_value = /*c*/ ctx[4] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*manifest*/ 1 && t2_value !== (t2_value = /*training_images_for*/ ctx[2](/*c*/ ctx[4]) + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(36:4) {#each manifest.classifications as c}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div5;
    	let div0;
    	let span0;
    	let t0_value = /*manifest*/ ctx[0].root_image_location + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*manifest*/ ctx[0].images.length + "";
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let t5;
    	let div2;
    	let button;
    	let t7;
    	let div3;
    	let p;
    	let t8;
    	let t9;
    	let div4;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;
    	let each_value = /*manifest*/ ctx[0].classifications;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = text(" images");
    			t4 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "Classify!";
    			t7 = space();
    			div3 = element("div");
    			p = element("p");
    			t8 = text(/*classificationStatus*/ ctx[1]);
    			t9 = space();
    			div4 = element("div");
    			img = element("img");
    			attr_dev(span0, "class", "title");
    			add_location(span0, file$4, 31, 4, 718);
    			attr_dev(span1, "class", "tag is-primary");
    			add_location(span1, file$4, 32, 4, 780);
    			attr_dev(div0, "class", "has-text-centered");
    			add_location(div0, file$4, 30, 2, 682);
    			attr_dev(div1, "class", "columns has-text-centered");
    			add_location(div1, file$4, 34, 2, 859);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "button");
    			add_location(button, file$4, 45, 4, 1178);
    			attr_dev(div2, "class", "has-text-centered");
    			add_location(div2, file$4, 44, 2, 1142);
    			add_location(p, file$4, 51, 4, 1327);
    			attr_dev(div3, "class", "has-text-centered");
    			add_location(div3, file$4, 50, 2, 1291);
    			attr_dev(img, "class", "is-hidden");
    			attr_dev(img, "id", "imgHolder");
    			attr_dev(img, "crossorigin", "");
    			if (img.src !== (img_src_value = "/favicon.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "100");
    			attr_dev(img, "height", "100");
    			attr_dev(img, "alt", "Image holder for training and classification");
    			add_location(img, file$4, 55, 4, 1454);
    			attr_dev(div4, "class", "has-text-centered");
    			add_location(div4, file$4, 53, 2, 1368);
    			attr_dev(div5, "class", "box");
    			add_location(div5, file$4, 29, 0, 662);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, span1);
    			append_dev(span1, t2);
    			append_dev(span1, t3);
    			append_dev(div5, t4);
    			append_dev(div5, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div5, t5);
    			append_dev(div5, div2);
    			append_dev(div2, button);
    			append_dev(div5, t7);
    			append_dev(div5, div3);
    			append_dev(div3, p);
    			append_dev(p, t8);
    			append_dev(div5, t9);
    			append_dev(div5, div4);
    			append_dev(div4, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*doClassification*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*manifest*/ 1 && t0_value !== (t0_value = /*manifest*/ ctx[0].root_image_location + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*manifest*/ 1 && t2_value !== (t2_value = /*manifest*/ ctx[0].images.length + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*training_images_for, manifest*/ 5) {
    				each_value = /*manifest*/ ctx[0].classifications;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*classificationStatus*/ 2) set_data_dev(t8, /*classificationStatus*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Manifest", slots, []);
    	let { manifest } = $$props;
    	let classificationStatus = "ready and waiting";

    	function training_images_for(c) {
    		return manifest.images.filter(img => img.c == c).length;
    	}

    	function doClassification() {
    		$$invalidate(1, classificationStatus = "Initiating classification");
    		const worker = new Worker("./WebClassifier.js");

    		worker.addEventListener("message", e => {
    			switch (e.data.action) {
    				case "TFINIT":
    					worker.postMessage({ action: "CLASSIFY", manifest });
    					break;
    				default:
    					$$invalidate(1, classificationStatus = e.data.message);
    			}
    		});
    	}

    	const writable_props = ["manifest"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Manifest> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("manifest" in $$props) $$invalidate(0, manifest = $$props.manifest);
    	};

    	$$self.$capture_state = () => ({
    		manifest,
    		classificationStatus,
    		training_images_for,
    		doClassification
    	});

    	$$self.$inject_state = $$props => {
    		if ("manifest" in $$props) $$invalidate(0, manifest = $$props.manifest);
    		if ("classificationStatus" in $$props) $$invalidate(1, classificationStatus = $$props.classificationStatus);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [manifest, classificationStatus, training_images_for, doClassification];
    }

    class Manifest extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { manifest: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Manifest",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*manifest*/ ctx[0] === undefined && !("manifest" in props)) {
    			console.warn("<Manifest> was created without expected prop 'manifest'");
    		}
    	}

    	get manifest() {
    		throw new Error("<Manifest>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set manifest(value) {
    		throw new Error("<Manifest>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.4 */

    const { Object: Object_1$1 } = globals;
    const file$5 = "src/App.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (39:2) {#if manifest}
    function create_if_block_1(ctx) {
    	let manifest_1;
    	let current;

    	manifest_1 = new Manifest({
    			props: { manifest: /*manifest*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(manifest_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(manifest_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const manifest_1_changes = {};
    			if (dirty & /*manifest*/ 2) manifest_1_changes.manifest = /*manifest*/ ctx[1];
    			manifest_1.$set(manifest_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(manifest_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(manifest_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(manifest_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(39:2) {#if manifest}",
    		ctx
    	});

    	return block;
    }

    // (42:2) {#if results}
    function create_if_block(ctx) {
    	let div;
    	let current;
    	let each_value = Object.keys(/*results*/ ctx[3]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "columns");
    			add_location(div, file$5, 42, 4, 1166);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, results*/ 8) {
    				each_value = Object.keys(/*results*/ ctx[3]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(42:2) {#if results}",
    		ctx
    	});

    	return block;
    }

    // (44:6) {#each Object.keys(results) as c}
    function create_each_block$3(ctx) {
    	let div;
    	let classification;
    	let t;
    	let current;

    	classification = new Classification({
    			props: {
    				name: /*c*/ ctx[6],
    				matches: /*results*/ ctx[3][/*c*/ ctx[6]].matches
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(classification.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "column");
    			add_location(div, file$5, 44, 8, 1236);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(classification, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const classification_changes = {};
    			if (dirty & /*results*/ 8) classification_changes.name = /*c*/ ctx[6];
    			if (dirty & /*results*/ 8) classification_changes.matches = /*results*/ ctx[3][/*c*/ ctx[6]].matches;
    			classification.$set(classification_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(classification.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(classification.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(classification);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(44:6) {#each Object.keys(results) as c}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let nav;
    	let div0;
    	let p0;
    	let t1;
    	let p1;
    	let t2;
    	let t3;
    	let p2;
    	let t4;
    	let t5;
    	let div2;
    	let div1;
    	let p3;
    	let span0;
    	let t7;
    	let p4;
    	let span1;
    	let t9;
    	let section;
    	let t10;
    	let t11;
    	let manifestloader;
    	let t12;
    	let resultsfileloader;
    	let t13;
    	let footer;
    	let div3;
    	let current;
    	let if_block0 = /*manifest*/ ctx[1] && create_if_block_1(ctx);
    	let if_block1 = /*results*/ ctx[3] && create_if_block(ctx);
    	manifestloader = new ManifestLoader({ $$inline: true });
    	manifestloader.$on("manifestLoaded", /*manifestLoaded*/ ctx[4]);
    	resultsfileloader = new ResultsFileLoader({ $$inline: true });
    	resultsfileloader.$on("resultsLoaded", /*resultsLoaded*/ ctx[5]);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "MOIC - Biofilm image classifier";
    			t1 = space();
    			p1 = element("p");
    			t2 = text(/*manifestFile*/ ctx[0]);
    			t3 = space();
    			p2 = element("p");
    			t4 = text(/*resultsFile*/ ctx[2]);
    			t5 = space();
    			div2 = element("div");
    			div1 = element("div");
    			p3 = element("p");
    			span0 = element("span");
    			span0.textContent = "matches";
    			t7 = space();
    			p4 = element("p");
    			span1 = element("span");
    			span1.textContent = "uncertain matches";
    			t9 = space();
    			section = element("section");
    			if (if_block0) if_block0.c();
    			t10 = space();
    			if (if_block1) if_block1.c();
    			t11 = space();
    			create_component(manifestloader.$$.fragment);
    			t12 = space();
    			create_component(resultsfileloader.$$.fragment);
    			t13 = space();
    			footer = element("footer");
    			div3 = element("div");
    			div3.textContent = "Built by Paul J. Cullen and Robert M. Romito";
    			attr_dev(p0, "class", "navbar-item title");
    			add_location(p0, file$5, 23, 4, 613);
    			attr_dev(p1, "class", "navbar-item subtitle");
    			add_location(p1, file$5, 24, 4, 682);
    			attr_dev(p2, "class", "navbar-item subtitle");
    			add_location(p2, file$5, 25, 4, 737);
    			attr_dev(div0, "class", "navbar-brand");
    			add_location(div0, file$5, 22, 2, 582);
    			attr_dev(span0, "class", "tag is-info");
    			add_location(span0, file$5, 29, 29, 882);
    			attr_dev(p3, "class", "navbar-item");
    			add_location(p3, file$5, 29, 6, 859);
    			attr_dev(span1, "class", "tag is-warning");
    			add_location(span1, file$5, 31, 8, 965);
    			attr_dev(p4, "class", "navbar-item");
    			add_location(p4, file$5, 30, 6, 933);
    			attr_dev(div1, "class", "navbar-end");
    			add_location(div1, file$5, 28, 4, 828);
    			attr_dev(div2, "class", "navbar-menu");
    			add_location(div2, file$5, 27, 2, 798);
    			attr_dev(nav, "class", "navbar is-fixed-top");
    			add_location(nav, file$5, 21, 0, 546);
    			attr_dev(section, "class", "section");
    			add_location(section, file$5, 37, 0, 1058);
    			attr_dev(div3, "class", "content has-text-centered");
    			add_location(div3, file$5, 55, 2, 1523);
    			attr_dev(footer, "class", "footer");
    			add_location(footer, file$5, 54, 0, 1497);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(div0, t3);
    			append_dev(div0, p2);
    			append_dev(p2, t4);
    			append_dev(nav, t5);
    			append_dev(nav, div2);
    			append_dev(div2, div1);
    			append_dev(div1, p3);
    			append_dev(p3, span0);
    			append_dev(div1, t7);
    			append_dev(div1, p4);
    			append_dev(p4, span1);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, section, anchor);
    			if (if_block0) if_block0.m(section, null);
    			append_dev(section, t10);
    			if (if_block1) if_block1.m(section, null);
    			append_dev(section, t11);
    			mount_component(manifestloader, section, null);
    			append_dev(section, t12);
    			mount_component(resultsfileloader, section, null);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div3);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*manifestFile*/ 1) set_data_dev(t2, /*manifestFile*/ ctx[0]);
    			if (!current || dirty & /*resultsFile*/ 4) set_data_dev(t4, /*resultsFile*/ ctx[2]);

    			if (/*manifest*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*manifest*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(section, t10);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*results*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*results*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(section, t11);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(manifestloader.$$.fragment, local);
    			transition_in(resultsfileloader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(manifestloader.$$.fragment, local);
    			transition_out(resultsfileloader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(section);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(manifestloader);
    			destroy_component(resultsfileloader);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let manifestFile = "";
    	let manifest;

    	function manifestLoaded(event) {
    		$$invalidate(0, manifestFile = event.detail.file);
    		$$invalidate(1, manifest = event.detail.manifest);
    	}

    	let resultsFile = "";
    	let results;

    	function resultsLoaded(event) {
    		$$invalidate(2, resultsFile = event.detail.file);
    		$$invalidate(3, results = event.detail.results);
    	}

    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Classification,
    		ResultsFileLoader,
    		ManifestLoader,
    		Manifest,
    		manifestFile,
    		manifest,
    		manifestLoaded,
    		resultsFile,
    		results,
    		resultsLoaded
    	});

    	$$self.$inject_state = $$props => {
    		if ("manifestFile" in $$props) $$invalidate(0, manifestFile = $$props.manifestFile);
    		if ("manifest" in $$props) $$invalidate(1, manifest = $$props.manifest);
    		if ("resultsFile" in $$props) $$invalidate(2, resultsFile = $$props.resultsFile);
    		if ("results" in $$props) $$invalidate(3, results = $$props.results);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [manifestFile, manifest, resultsFile, results, manifestLoaded, resultsLoaded];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
