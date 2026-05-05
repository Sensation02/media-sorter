---
name: rust-best-practices
description: Expert knowledge of Rust — core concepts, idioms, patterns, tooling, and community wisdom. Use this skill when working on Rust projects for design decisions, refactoring, performance optimization, error handling, async code, and choosing the right crates.
---

# Rust Best Practices Skill

A reference for working with Rust: from fundamental concepts to subtleties known only to experienced Rustaceans.

---

## 1. Core Language Features

### Memory & Safety

- **Ownership & Borrowing** — every value has a single owner; transferred via `move` or borrowed via `&` / `&mut`. Memory safety without a GC.
- **Lifetimes** — the compiler statically verifies that references don't outlive the data they point to.
- **Fearless concurrency** — the type system prevents data races (`Send` / `Sync` marker traits).

### Abstractions & Types

- **Zero-cost abstractions** — iterators, generics, and async are monomorphized and inlined.
- **Algebraic data types** — `enum` with data + exhaustive `match`. Instead of `null` → `Option<T>`, instead of exceptions → `Result<T, E>`.
- **Traits over inheritance** — composition through behavior, with default implementations and trait objects (`dyn Trait`).

### Ecosystem

- **Cargo + crates.io** — build system, tests, benchmarks, docs, formatter, linter out of the box.

---

## 2. Fundamental Rules to Follow

1. **Don't fight the borrow checker** — if it's hard, the design is usually wrong, not the compiler. Think about who actually owns the data.

2. **Avoid `clone()` and `unwrap()` in production code** — `clone` is a crutch, `unwrap` is a time bomb. Use `?`, `expect("why this is safe")`, or `match`.

3. **Embrace Result/Option** — handle errors explicitly with `thiserror` (for libraries) or `anyhow` (for applications).

4. **Think in iterators, not loops** — `.map().filter().collect()` is clearer and just as fast.

   ```rust
   // Imperative
   let mut result = Vec::new();
   for x in &items {
       if x.active {
           result.push(x.name.to_uppercase());
       }
   }

   // Idiomatic
   let result: Vec<_> = items.iter()
       .filter(|x| x.active)
       .map(|x| x.name.to_uppercase())
       .collect();
   ```

5. **Newtype pattern** — wrap primitives in types to avoid mixing them up.

   ```rust
   struct UserId(u64);
   struct OrderId(u64);

   fn fetch_user(id: UserId) -> User { /* ... */ }

   let order = OrderId(42);
   // fetch_user(order); // Compile error — type safety guaranteed
   ```

6. **`cargo clippy` + `cargo fmt`** — standard before every commit. Clippy catches 80% of beginner mistakes.

7. **Minimize `unsafe`** — if you must use it, isolate it in a small module with a safe API on top and a comment explaining why it's correct.

8. **Async only when truly needed** — for CPU-bound tasks, plain threads are often better. Don't mix tokio/async-std in one project.

---

## 3. Design & Types

### Make illegal states unrepresentable

A mantra from Yaron Minsky. If a combination of fields makes no sense, encode it in an `enum` instead of validating at runtime.

```rust
// Bad: you can have verified: true without an email
struct User {
    email: Option<String>,
    email_verified: bool,
}

// Better
enum EmailStatus {
    None,
    Unverified(String),
    Verified(String),
}
```

### Typestate pattern

Encode state in types. The compiler won't let you call methods in the wrong order.

```rust
use std::marker::PhantomData;

struct HttpRequest<State> {
    url: String,
    _state: PhantomData<State>,
}

struct Unsent;
struct Sent;

impl HttpRequest<Unsent> {
    fn new(url: String) -> Self {
        Self { url, _state: PhantomData }
    }

    fn send(self) -> HttpRequest<Sent> {
        // Perform the request...
        HttpRequest { url: self.url, _state: PhantomData }
    }
}

impl HttpRequest<Sent> {
    fn body(&self) -> &str { "response data" }
}

// req.body();        // Won't compile — request not sent yet
// req.send().send(); // Won't compile — already sent
```

### Builder pattern

Use for complex constructors. Better than 12 parameters in `new()`. Use the `derive_builder` crate or write by hand.

```rust
use std::time::Duration;

pub struct Request {
    url: String,
    timeout: Duration,
    retries: u32,
}

pub struct RequestBuilder {
    url: Option<String>,
    timeout: Duration,
    retries: u32,
}

impl RequestBuilder {
    pub fn new() -> Self {
        Self {
            url: None,
            timeout: Duration::from_secs(30),
            retries: 3,
        }
    }

    pub fn url(mut self, url: impl Into<String>) -> Self {
        self.url = Some(url.into());
        self
    }

    pub fn timeout(mut self, t: Duration) -> Self {
        self.timeout = t;
        self
    }

    pub fn build(self) -> Result<Request, &'static str> {
        Ok(Request {
            url: self.url.ok_or("url is required")?,
            timeout: self.timeout,
            retries: self.retries,
        })
    }
}

let req = RequestBuilder::new()
    .url("https://api.example.com")
    .timeout(Duration::from_secs(10))
    .build()?;
```

### `#[must_use]`

Apply on functions/types where ignoring the result is a bug.

```rust
#[must_use = "this Result may be an Err and should be handled"]
pub fn save() -> Result<(), std::io::Error> { Ok(()) }

// Guard objects that must not be discarded
#[must_use = "dropping this guard immediately releases the lock"]
pub struct LockGuard<'a> { /* ... */ }

save();  // Warning: unused `Result` that must be used
```

### Sealed traits

If you don't want users to implement your trait, add a supertrait in a private module.

```rust
mod private {
    pub trait Sealed {}
}

pub trait MyTrait: private::Sealed {
    fn do_thing(&self);
}

pub struct MyType;

impl private::Sealed for MyType {}
impl MyTrait for MyType {
    fn do_thing(&self) { /* ... */ }
}

// External code cannot impl MyTrait — they can't access private::Sealed
```

### Parse, don't validate

Alexis King's principle. Convert raw data into a type that *guarantees* validity at the type level.

```rust
// Bad: validation that doesn't enrich types
fn validate_email(s: &str) -> Result<(), Error> { /* ... */ }
// Caller still holds &str — must remember to validate everywhere

// Good: parsing produces a new type
pub struct Email(String);

impl Email {
    pub fn parse(s: String) -> Result<Self, EmailError> {
        if !s.contains('@') {
            return Err(EmailError::Invalid);
        }
        Ok(Self(s))
    }

    pub fn as_str(&self) -> &str { &self.0 }
}

// Now this signature is provably correct:
fn send_welcome(to: Email) { /* impossible to call with invalid email */ }
```

---

## 4. Error Handling

- **`thiserror` for libraries, `anyhow` for binaries** — near-consensus. Don't mix: libraries should give precise types, applications can conveniently aggregate.
- **Don't use `Box<dyn Error>` in a library's public API** — users won't be able to match on it properly.
- **Prefer `expect()` over `unwrap()`** — the message becomes documentation of invariants.

### `?` with `#[from]` for automatic conversion

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),

    #[error("parse error: {0}")]
    Parse(#[from] std::num::ParseIntError),

    #[error("config missing key: {0}")]
    MissingKey(String),
}

fn read_number(path: &str) -> Result<i32, AppError> {
    let content = std::fs::read_to_string(path)?;  // io::Error → AppError
    let n = content.trim().parse()?;                // ParseIntError → AppError
    Ok(n)
}
```

### `anyhow` for application code

```rust
use anyhow::{Context, Result};

fn load_config(path: &str) -> Result<Config> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("failed to read config from {path}"))?;
    let cfg = toml::from_str(&content)
        .context("config file is not valid TOML")?;
    Ok(cfg)
}
```

---

## 5. Performance

### `Cow<'a, str>` — borrow when possible, own when needed

Ideal for parsers and transformations where most inputs pass through unchanged.

```rust
use std::borrow::Cow;

fn normalize(input: &str) -> Cow<'_, str> {
    if input.contains(' ') {
        Cow::Owned(input.replace(' ', "_"))   // Allocate only when needed
    } else {
        Cow::Borrowed(input)                   // Otherwise reuse the slice
    }
}
```

### `SmallVec` for stack-allocated small collections

```rust
use smallvec::{SmallVec, smallvec};

// Stores up to 4 elements inline; spills to the heap if larger
let mut v: SmallVec<[u32; 4]> = smallvec![1, 2, 3];
v.push(4);  // Still on the stack
v.push(5);  // Now allocates on the heap
```

### `Box<str>` vs `String`, `Box<[T]>` vs `Vec<T>`

For immutable data, save 8 bytes (the unused capacity field) per struct.

```rust
struct Config {
    name: Box<str>,        // 16 bytes: ptr + len, immutable
    tags: Box<[String]>,   // 16 bytes: ptr + len, immutable
}

// Conversion is cheap and lossless
let s: String = "hello".to_string();
let immut: Box<str> = s.into_boxed_str();
```

### Profile, then optimize

- **Use `#[inline]` carefully** — the compiler is usually smarter. Apply only after profiling, or on small functions across crate boundaries.
- **Don't optimize without measuring** — `cargo flamegraph` + `cargo bench` (criterion) is the standard.

---

## 6. Async

- **One executor per project** — usually tokio. Mixing breaks the ecosystem.
- **`Send` bounds eat time** — if a future doesn't need to move between threads, use `tokio::task::spawn_local` + `LocalSet`.
- **Cancellation safety** — futures can be dropped at `await`. In `tokio::select!`, don't use non-cancel-safe branches without `pin!` and manual control.

### Avoid blocking operations in async code

```rust
use std::path::PathBuf;
use tokio::task;

async fn parse_huge_file(path: PathBuf) -> std::io::Result<String> {
    // Heavy CPU work or sync I/O — offload to a blocking thread pool
    task::spawn_blocking(move || {
        std::fs::read_to_string(&path)
    })
    .await
    .expect("blocking task panicked")
}
```

### Actor pattern instead of `Arc<Mutex<T>>`

Channels + a single owning task is often cleaner than shared mutable state.

```rust
use tokio::sync::{mpsc, oneshot};
use std::collections::HashMap;

enum Message {
    Get { key: String, reply: oneshot::Sender<Option<String>> },
    Set { key: String, value: String },
}

async fn run_actor(mut rx: mpsc::Receiver<Message>) {
    let mut store: HashMap<String, String> = HashMap::new();
    while let Some(msg) = rx.recv().await {
        match msg {
            Message::Get { key, reply } => {
                let _ = reply.send(store.get(&key).cloned());
            }
            Message::Set { key, value } => {
                store.insert(key, value);
            }
        }
    }
}

// Usage:
// let (tx, rx) = mpsc::channel(32);
// tokio::spawn(run_actor(rx));
//
// let (reply_tx, reply_rx) = oneshot::channel();
// tx.send(Message::Get { key: "k".into(), reply: reply_tx }).await?;
// let value = reply_rx.await?;
```

### `tokio::select!` with cancellation safety

```rust
use tokio::time::{sleep, Duration};
use tokio::sync::mpsc;

async fn worker(mut rx: mpsc::Receiver<u32>) {
    loop {
        tokio::select! {
            // recv() is cancel-safe
            Some(item) = rx.recv() => {
                process(item).await;
            }
            // sleep() is cancel-safe
            _ = sleep(Duration::from_secs(60)) => {
                println!("heartbeat");
            }
            else => break,
        }
    }
}

async fn process(_item: u32) { /* ... */ }
```

---

## 7. Traits & Generics

- **`impl Trait` in arguments = convenience, in return position = rigidity** (only one concrete type can be returned). For dynamic choice → `Box<dyn Trait>`.
- **GATs (Generic Associated Types)** — powerful but complex. Don't reach for them until you really need to (lending iterators, etc.).

### Extension traits — add methods to foreign types

```rust
pub trait StrExt {
    fn count_words(&self) -> usize;
    fn truncate_to(&self, max: usize) -> &str;
}

impl StrExt for str {
    fn count_words(&self) -> usize {
        self.split_whitespace().count()
    }

    fn truncate_to(&self, max: usize) -> &str {
        match self.char_indices().nth(max) {
            Some((idx, _)) => &self[..idx],
            None => self,
        }
    }
}

let n = "hello world from rust".count_words();   // 4
let preview = "long text...".truncate_to(4);     // "long"
```

### `PhantomData` — type parameters without storage

Common for typestate, units of measurement, and lifetime tracking.

```rust
use std::marker::PhantomData;

struct Length<Unit> {
    value: f64,
    _unit: PhantomData<Unit>,
}

struct Meters;
struct Feet;

impl<U> Length<U> {
    fn new(value: f64) -> Self {
        Self { value, _unit: PhantomData }
    }
}

fn jump_height(h: Length<Meters>) { /* ... */ }

let h_m: Length<Meters> = Length::new(1.8);
let h_ft: Length<Feet> = Length::new(6.0);

jump_height(h_m);
// jump_height(h_ft);  // Compile error — wrong unit
```

### `impl Trait` vs `dyn Trait` in returns

```rust
// impl Trait — static dispatch, one concrete type, zero overhead
fn make_iter() -> impl Iterator<Item = i32> {
    (0..10).filter(|n| n % 2 == 0)
}

// dyn Trait — dynamic dispatch, runtime choice, vtable lookup
fn make_iter_dyn(reversed: bool) -> Box<dyn Iterator<Item = i32>> {
    if reversed {
        Box::new((0..10).rev())
    } else {
        Box::new(0..10)
    }
}
```

---

## 8. Tooling

### Essentials

- **`cargo clippy`** — linter. Run it constantly.
- **`cargo fmt`** — formatter. Enforce in CI.
- **`cargo check`** — fast compilation check without producing a binary.

### Lesser-known but valuable

- **`cargo expand`** — shows code after macro expansion. Indispensable for debugging `derive` and custom macros.
- **`cargo machete`** — finds unused dependencies.
- **`cargo udeps`** — same, but more accurate (requires nightly).
- **`cargo nextest`** — faster and more convenient test runner.
- **`cargo deny`** — checks licenses, duplicates, security advisories.
- **`bacon`** — background watcher that re-runs check/clippy/test on changes. Best feedback loop.
- **`miri`** — interpreter for catching UB in `unsafe` code.
- **`cargo flamegraph`** — profiling.
- **`criterion`** — statistically rigorous benchmarks.

---

## 9. Philosophy

Principles repeated by the gurus (Aaron Turon, Niko Matsakis, Jon Gjengset, fasterthanli.me):

- **"Make the right thing easy and the wrong thing hard"** — APIs should make incorrect usage fail to compile.
- **"Parse, don't validate"** — convert data into valid types at the boundary, don't validate everywhere.
- **Think in data flow, not OO hierarchies** — Rust is not Java. Structs = data, traits = behavior, no "classes."
- **Read the std source code** — brilliantly written and documented. `Vec`, `Option`, `Iterator` are must-reads for understanding idioms.

---

## 10. New Project Checklist

- [ ] `cargo new` + initial module structure
- [ ] Configure `rustfmt.toml` and `clippy.toml` for the team
- [ ] Add `cargo deny` config
- [ ] CI: `fmt --check`, `clippy -- -D warnings`, `test`, `nextest`
- [ ] Choose error strategy: `thiserror` (lib) / `anyhow` (bin)
- [ ] Choose async runtime (usually `tokio`) — and don't mix
- [ ] Set up logging (`tracing` > `log` for async)
- [ ] Add `#![deny(unsafe_code)]` in crate root if you don't need unsafe
- [ ] Documentation with examples via `///` and `cargo doc --open`

---

## 11. Useful Crates by Category

| Category | Crates |
|----------|--------|
| Errors | `thiserror`, `anyhow`, `eyre` |
| Async runtime | `tokio`, `async-std` (rare) |
| HTTP server | `axum`, `actix-web`, `rocket` |
| HTTP client | `reqwest`, `hyper` |
| Serialization | `serde`, `serde_json`, `bincode`, `postcard` |
| Logging/tracing | `tracing`, `tracing-subscriber` |
| CLI | `clap`, `argh` |
| Database | `sqlx`, `sea-orm`, `diesel` |
| Testing | `criterion`, `proptest`, `insta`, `mockall` |
| Utilities | `itertools`, `once_cell`, `parking_lot`, `dashmap` |

---

## How to Use This Skill

When working on Rust code, refer to the relevant sections:
- **Architectural decision** → sections 3, 7, 9
- **Code won't compile / borrow checker issue** → section 2 (rule 1)
- **Error handling** → section 4
- **Slow code** → section 5
- **Async problems** → section 6
- **Project setup** → sections 8, 10, 11
