---
date: 2026-06-07
title: "Chasing Cyclic Demons: Building a 2D Cellular Automaton in the Browser with Rust & WebAssembly"
teaser: "Building a high-performance 2D cellular automaton in the browser with Rust and WebAssembly, and chasing the N+1 halting mystery."
thumbnail: "../images/Monarch.png"
slug: cyclic-demons
---

# Chasing Cyclic Demons: Building a 2D Cellular Automaton in the Browser with Rust & WebAssembly

There is something inherently mesmerizing about cellular automata. You define a set of simple, localized rules, hit "play," and watch as complex, macroscopic patterns emerge from your favorite image. 

Recently, I decided to build a browser-based visualization of a specific type of cellular automaton called **Cyclic Space**, discovered by David Griffeath of the University of Wisconsin in 1990 and detailed in A.K. Dewdney's *The Magic Machine*. 

In Cyclic Space, each cell is assigned a state (a color) from `0` to `N-1`. The rule is simple: a cell is "eaten" by a neighboring cell (up, down, left, or right) if that neighbor’s state is exactly one step ahead in the cycle. Color `N-1` is eaten by color `0`. The cells wrap top-to-bottom and left-to-right in a toroidal geometry.

You can play with the live version here: **[live version](https://cyclicdemons.netlify.app/)**  
*(Source code available on [GitHub](https://github.com/dmaynard/cyclicdemons))*

---

## 🚀 The Tech Stack: Why Rust and WebAssembly?

I wanted this to be a highly interactive web app where users could drag-and-drop their own images, have the system extract the colors, and run the automaton on those exact colors. 

Running a pixel-by-pixel simulation on high-resolution images (potentially over a million pixels) at 60 frames-per-second is tough in pure JavaScript. To solve this, I split the architecture:
*   **The Frontend (React + TypeScript):** Handles the UI, drag-and-drop file inputs, and paints the final output to an HTML5 `<canvas>`.
*   **The Engine (Rust + WASM):** Handles all the heavy mathematical lifting and grid traversal. 

By using WebAssembly, I could allocate a static chunk of memory (a **Zero-Copy Buffer**) within the WASM sandbox. Rust writes the modified image pixels directly into this shared memory buffer, and the JavaScript `<canvas>` reads from it directly without any cloning or garbage collection. While the exact framerate still depends on the size of the uploaded image, this architecture allows the simulation to run orders of magnitude faster (and on much larger images) than a pure JavaScript implementation could handle. Of course, having static mutable arrays in Rust is antithetical to Rust's philosophy, so the code is littered with `unsafe` blocks. But being an old game programmer, sometimes you gotta do what you gotta do for performance.

## 🎨 Dynamic States via Median Cut Quantization

Instead of hardcoding a set of colors, the states of the automaton are generated dynamically based on whatever image the user uploads. 

When you drop an image onto the canvas, the Rust core runs a custom implementation of the **Median Cut algorithm**. It scans the millions of pixels in the image and efficiently clusters them into a deterministic color palette (e.g., the top 16 or 32 distinct colors that represent the image). 

Those colors then become the exact states of the `0` to `N-1` cycle.

## 🤯 The "Aha!" Debugging Moment: Finding the Halting Period

One of the most interesting challenges during development was figuring out **when to halt the simulation**. 

Depending on the image and the number of colors, you generally see three distinct behaviors in Cyclic Space:
1. **Perfect Equilibrium:** With larger numbers of colors, the simulation often reaches a state where no pixels change from frame to frame. The simulation can easily halt here.
2. **Full-Image Oscillations:** Sometimes, the grid reaches a state where *every single pixel* changes on every frame. Since this is perfectly stable, we can also halt.
3. **Cyclic Demons:** With smaller numbers of colors, spirals of color form. These "demons" continue to grow until they fill the image or collide with other spirals. 

This third case was the trickiest. In many runs, the grid reaches a state where *almost* every pixel changes every frame, but never quite all of them. The image appears to go through a repeating cycle, but because the pixel change count never hits 0 or 100%, the simulation runs indefinitely. To prevent infinite loops, we needed a way to detect this cycle and halt.

Logically, if there are `N` colors in the cycle, one might expect an individual cell to return to its original state exactly every `N` frames. If so, the global count of changed pixels should also repeat with a perfect period of `N`. 

I wrote a test to track this: keep a sliding window array of the last `N` frame change counts. If the current number of changed pixels exactly matches the number from `N` frames ago, start incrementing a `Synced` counter. If `Synced > N`, halt.

**It didn't halt.** 

I suspected a bug in my implementation. To find out what was happening, I added a "dump history" button to output the last 256 frame-change counts to a text file for manual analysis. 

When I analyzed the log, I found something fascinating. The sequence *was* perfectly repeating, but **the period was exactly N+1** in some cases, and **N** in others. Specifically, the period of the global changed count was $N$ when $N$ was even, but $N+1$ when $N$ was odd!

It turns out there is a beautiful mathematical explanation for this parity behavior:
1. **The Grid is Bipartite (Checkerboard):** Under a Von Neumann neighborhood (up, down, left, right), a 2D grid forms a bipartite graph. We can color the cells black and white like a checkerboard, where white cells only look at black cells, and vice versa.
2. **State Propagation Flips Parity:** At each time step, a state change propagates from a cell of one parity to a neighbor of the opposite parity. For a wave crest to travel and return to its starting cell in the same state, the path it takes must form a closed loop. Because the grid is bipartite, **any closed loop of propagation must have an even number of steps**. Thus, the period of any stable repeating wave must be an even number of frames.
3. **Parity Realignment:** 
   - When $N$ is **even**, the natural period $N$ is already even. It aligns perfectly with the bipartite grid, and the simulation oscillates with period $N$.
   - When $N$ is **odd**, a period of $N$ is impossible because a wave cannot return to its start point on the checkerboard in an odd number of steps. The system is forced to resolve this by shifting to the next possible even integer, which is $N+1$.

Updating the halting logic in Rust to look back $N$ frames when $N$ is even, and $N+1$ frames when $N$ is odd worked perfectly for most images. In these cases, the board eventually crystallizes into stable spirals, and the test detects the cycle and halts the simulation. There were some edge cases, however, that caused the simulation to run indefinitely.

## Conclusion

Building this was a nice exercise in optimizing browser performance and a great reminder of how unpredictable emergent systems can be. The math isn't just theory—it actively dictates how you have to write your termination loops!

If you want to try it out, upload a picture of your cat or your favorite album cover and watch the demons take over. Try varying the numbers of colors to see how the patterns evolve. 

*Check out the [Live Demo](https://cyclicdemons.netlify.app/) or dig into the [GitHub Repo](https://github.com/dmaynard/cyclicdemons).* 
