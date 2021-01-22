const SPACE = 32
const BACKSPACE = 8
const CANCELLED = [13, 33, 34, 35, 36, 37, 38, 39, 40]
const IGNORED = [16, 17, 18, 37, 91, 93, 186, 219, 225]

function get_cookie(name) {
  let name_eq = name + "="
  const cookies = document.cookie.split(";")
  for (var i = 0; i < cookies.length; i++) {
    let c = cookies[i]
    while (c.charAt(0) == " ") c = c.substring(1, c.length)
    if (c.indexOf(name_eq) == 0) return c.substring(name_eq.length, c.length)
  }
  return null
}

function toggle_theme() {
  const theme = get_cookie("theme")
  let cookie_theme

  if (!theme || theme == "dark") {
    cookie_theme = "theme=light; Path=/"
    document.body.classList.add("light-theme")
    document.body.classList.remove("dark-theme")
  } else if (theme == "light") {
    cookie_theme = "theme=dark; Path=/"
    document.body.classList.add("dark-theme")
    document.body.classList.remove("light-theme")
  }

  document.cookie = cookie_theme
}

class WordManager {
  constructor(dictionary, render_text) {
    this.dictionary = dictionary || ["foo", "bar"]
    this.render_text = render_text || "render-text"

    this.raw_wordcount = 0
    this.wordcount = 0
    this.raw_charcount = 0
    this.charcount = 0
    this.seconds = 0
    this.errors = 0
    this.character_length = 45

    this.words = []
    this.shouldScroll = false
    this.interval_timer = null

    this.started = false
  }

  pickWords () {
    this.words = []
    for (let i = 0; i < 300; i++) {
      this.words.push(this.dictionary[Math.floor(Math.random() * this.dictionary.length)])
    }

    this.letters = this.words.join(" ")
  }

  render() {
    let input_el = document.getElementById(this.render_text)
    input_el.setAttribute('style', '--scroll:0')
    input_el.innerText = ''
    this.words.forEach((w, i) => {
      const wordEl = document.createElement('span')
      wordEl.className = 'word'
      w.split('').forEach((c, j) => {
        const charEl = document.createElement('span')
        charEl.className = 'char'
        charEl.innerText = c
        wordEl.appendChild(charEl)
      })
      input_el.appendChild(wordEl)
    })
    document.querySelector('.word').classList.add('current')
  }

  maybeScroll(prev, next) {
    if (prev.getBoundingClientRect().y !== next.getBoundingClientRect().y) {
      const container = document.getElementById(this.render_text)
      const back = prev.getBoundingClientRect().y > next.getBoundingClientRect().y
      const currentScroll = parseInt(container.getAttribute('style').split(':')[1])

      if (currentScroll === 0) {
        if (!back && !this.shouldScroll) {
          this.shouldScroll = true
          return
        }

        if (back) {
          return
        }
      }

      container.setAttribute('style', `--scroll:${currentScroll + (back ? -1 : 1)}`)
    }
  }

  hasFinishedWord () {
    return !document.querySelector('.current .char:not(.alizarin-text):not(.emerald-text)')
  }

  calcTypeTime(input) {
    return Math.round(input / (this.seconds / 60))
  }

  updateCpmWpm() {
    document.getElementById("wpm").innerText = this.calcTypeTime(this.wordcount)
    document.getElementById("wpm-tp").setAttribute(
      'data-tooltip', `Raw WPM: ${this.calcTypeTime(this.raw_wordcount)}`
    )
    document.getElementById("cpm").innerText = this.calcTypeTime(this.charcount)
    document.getElementById("cpm-tp").setAttribute(
      'data-tooltip', `Raw CPM: ${this.calcTypeTime(this.raw_charcount)}`
    )
  }

  resetScore(el_id, attribute) {
    const el = document.getElementById(el_id)
    el.innerText = el.getAttribute(attribute)
    el.style.display = "none"
  }

  start() {
    this.interval_timer = setInterval(() => {
      this.seconds++
      document.getElementById("seconds").innerText = 60 - this.seconds

      this.updateCpmWpm()

      console.log(`Seconds: ${this.seconds}\nWPM: ${this.wordcount}`)
      if (this.seconds >= 60) this.maybeStop()
    }, 1000)
  }

  maybeStop() {
    if (!this.hasFinishedWord()) {
      document.getElementById("seconds").innerText = window.TranslationData.FINISH_WORD
      this.pendingStop = true
    } else {
      this.stop()
    }
  }

  stop() {
    clearInterval(this.interval_timer)
    document.getElementById("seconds").innerText = '0'
    this.pendingStop = false
    this.started = false
    document.getElementById(this.render_text).classList.add("finish-anim")

    // Show final score
    this.updateCpmWpm()
    document.getElementById("your-attempt").style.display = "none"

    const final_score = document.getElementById("final-score")
    final_score.style.display = "block"
    final_score.innerText = final_score.innerText
      .replace("[CPM]", this.calcTypeTime(this.charcount))
      .replace("[WPM]", this.calcTypeTime(this.wordcount))

    if (this.errors == 0) {
      // Flawless run
      const win = document.getElementById("final-text-win")
      win.innerText = win.innerText.replace("[WORDS]", this.wordcount)
      win.style.display = "block"
    } else {
      // Lol the user made a mistake or two
      const lose = document.getElementById("final-text-fail")
      lose.innerText = lose.innerText
        .replace("[RAW_CPM]", this.calcTypeTime(this.raw_charcount))
        .replace("[WRONG]", this.errors)
      lose.style.display = "block"
    }

    if (this.calcTypeTime(this.raw_charcount) > 300) {
      document.getElementById("final-break").style.display = "block"
    }

    document.getElementById("final-score-container").style.display = "flex"
  }

  reset() {
    this.stop()
    this.raw_wordcount = 0
    this.wordcount = 0
    this.raw_charcount = 0
    this.charcount = 0
    this.seconds = 0
    this.errors = 0

    this.letters = null
    this.interval_timer = null

    this.index = 0
    this.started = false
    this.pendingStop = false
    this.shouldScroll = false

    document.getElementById(this.render_text).innerText = ""
    document.getElementById("your-attempt").value = ""
    document.getElementById("seconds").innerText = 60
    document.getElementById("wpm").innerText = 0
    document.getElementById("errors").innerText = 0
    document.getElementById("your-attempt").style.display = "block"
    document.getElementById(this.render_text).classList.remove("finish-anim")
    document.getElementById("final-score-container").style.display = "none"
    this.resetScore("final-score", "data-text")
    this.resetScore("final-text-win", "data-text")
    this.resetScore("final-text-fail", "data-text")

    this.pickWords()
    this.render()
  }

  keydown(event) {
    if (this.seconds >= 60 && !this.pendingStop) return

    if (!this.started) {
      this.start()
      this.started = true
      console.log("TypingTest started")
    }

    const pressed = event.which || event.key_code
    console.log(`Key pressed: ${pressed}`)

    if (CANCELLED.includes(pressed) || (event.ctrlKey && pressed === 65)) {
      event.preventDefault()
      return
    }

    if (IGNORED.includes(pressed)) return

    const currentWord = document.querySelector('.current')
    switch (pressed) {
      case SPACE:
        if (event.target.value[event.target.value.length - 1] === ' ') {
          console.log('Ignoring double space')
          event.preventDefault()
          return
        }

        // Mark remaining of current word as error'd
        currentWord.querySelectorAll('.char:not(.alizarin-text):not(.emerald-text)').forEach(char => {
          char.classList.add('alizarin-text')
          this.errors++
        })

        if (!currentWord.querySelector('.char.alizarin-text')) {
          this.raw_wordcount++
          this.wordcount++
        } else {
          this.raw_wordcount++
        }

        // Mark next word as current
        currentWord.classList.remove('current')
        currentWord.nextElementSibling.classList.add('current')
        this.maybeScroll(currentWord, currentWord.nextElementSibling)
        break
      case BACKSPACE:
        if (event.target.value[event.target.value.length - 1] === ' ') {
          currentWord.classList.remove('current')
          currentWord.previousElementSibling.classList.add('current')
          this.maybeScroll(currentWord, currentWord.previousElementSibling)
          if (!document.querySelector('.current .char.alizarin-text')) {
            this.raw_wordcount--
            this.wordcount--
          }
          if (!event.ctrlKey) break
        }
        let toRemove = [ ...document.querySelectorAll('.current .char.alizarin-text, .current .char.emerald-text') ]
        if (!event.ctrlKey) {
          // Make sure we're not in a dumb offset
          if (event.target.value.split(' ').pop().length > toRemove.length) {
            this.errors--
            break
          }
          toRemove = toRemove.slice(toRemove.length - 1)
        }
        toRemove.forEach(char => {
          this.raw_charcount--
          if (char.classList.contains('emerald-text')) {
            char.classList.remove('emerald-text')
            this.charcount--
          } else {
            char.classList.remove('alizarin-text')
            this.errors--
          }
        })
        break
      default:
        const typingFor = document.querySelector('.current .char:not(.alizarin-text):not(.emerald-text)')

        this.raw_charcount++
        if (!typingFor) {
          this.errors++
        } else if (typingFor.innerText === event.key) {
          typingFor.classList.add('emerald-text')
          this.charcount++
        } else {
          typingFor.classList.add('alizarin-text')
          this.errors++
        }

        if (this.pendingStop && this.hasFinishedWord()) this.stop()
        break
    }

    let errors_el = document.getElementById("errors")
    errors_el.innerText = this.errors

    let green = 255 - (this.errors * 5)
    errors_el.style.color = `rgb(255, ${green}, 0)`
  }
}
