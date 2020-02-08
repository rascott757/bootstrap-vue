// b-form-spinbutton
import Vue from '../../utils/vue'
import { arrayIncludes } from '../../utils/array'
import { isFunction, isNull } from '../../utils/inspect'
import { toFloat } from '../../utils/number'
import { toString } from '../../utils/string'
import KeyCodes from '../../utils/key-codes'
import idMixin from '../../mixins/id'
import { BButton } from '../button/button'
import { BIconPlus, BIconDash } from '../../icons/icons'

// --- Constants ---

const NAME = 'BFormSpinbutton'

const { UP, DOWN, HOME, END } = KeyCodes

const DEFAULT_MIN = 1
const DEFAULT_MAX = 100
const DEFAULT_STEP = 1

// -- Helper functions ---

const defaultNumber = (val, def) => {
  val = toFloat(val)
  return isNaN(val) ? def : val
}

// --- BFormSpinbutton ---
// @vue/cpmponent
export const BFormSpinbutton = /*#__PURE__*/ Vue.extend({
  name: NAME,
  mixins: [idMixin],
  inheritAttrs: false,
  props: {
    value: {
      // Should this really be String, to match native Number inputs?
      type: Number,
      default: null
    },
    min: {
      type: [Number, String],
      default: DEFAULT_MIN
    },
    max: {
      type: [Number, String],
      default: DEFAULT_MAX
    },
    step: {
      type: [Number, String],
      default: DEFAULT_STEP
    },
    wrap: {
      type: Boolean,
      default: false
    },
    formatterFn: {
      type: Function
      // default: null
    },
    size: {
      type: String
      // default: null
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    required: {
      // Only affects the `aria-invalid` attribute
      type: Boolean,
      default: false
    },
    name: {
      type: String
      // default: null
    },
    form: {
      type: String
      // default: null
    },
    state: {
      // Tri-state prop: true, false, or null
      type: Boolean,
      default: null
    },
    inline: {
      type: Boolean,
      default: false
    },
    vertical: {
      type: Boolean,
      default: false
    },
    labelIncrement: {
      type: String,
      default: 'Increment'
    },
    labelDecrement: {
      type: String,
      default: 'Decrement'
    }
  },
  data() {
    const value = toFloat(this.value)
    return {
      localValue: isNaN(value) ? null : value,
      hasFocus: false
    }
  },
  computed: {
    computedStep() {
      return defaultNumber(this.step, DEFAULT_STEP)
    },
    computedMin() {
      return defaultNumber(this.min, DEFAULT_MIN)
    },
    computedMax() {
      return defaultNumber(this.max, DEFAULT_MAX)
    },
    computedPrecision() {
      // Quick and dirty way to get the number of decimals
      const step = this.computedStep
      return Math.floor(step) === step ? 0 : (step.toString().split('.')[1] || '').length
    },
    computedMult() {
      return Math.pow(10, this.computedPrecision || 0)
    },
    formattedValue() {
      // Default formatting
      const value = this.localValue
      const precision = this.computedPrecision
      return isNull(value) ? '' : value.toFixed(precision)
    }
  },
  watch: {
    value(value) {
      value = toFloat(value) // Will be NaN if null
      this.localValue = isNaN(value) ? null : value
    },
    localValue(value) {
      this.$emit('input', value)
    }
  },
  methods: {
    setValue(value) {
      if (!this.disabled) {
        const min = this.computedMin
        const max = this.computedMax
        const wrap = this.wrap
        this.localValue =
          value > max ? (wrap ? min : max) : value < min ? (wrap ? max : min) : value
      }
    },
    onFocusBlur(evt) {
      if (!this.disabled) {
        this.hasFocus = evt.type === 'focus'
      } else {
        this.hasFocus = false
      }
    },
    increment() {
      const value = this.localValue
      if (isNull(value)) {
        this.localValue = this.computedMin
      } else {
        const step = this.computedStep
        const mult = this.computedMult
        // We ensure that precision is maintained
        this.setValue(Math.floor(value * mult + step * mult) / mult)
      }
    },
    decrement() {
      const value = this.localValue
      if (isNull(value)) {
        this.localValue = this.wrap ? this.computedMax : this.computedMin
      } else {
        const step = this.computedStep
        const mult = this.computedMult
        // We ensure that precision is maintained
        this.setValue(Math.floor(value * mult - step * mult) / mult)
      }
    },
    onKeydown(evt) {
      const { keyCode, altKey, ctrlKey, metaKey } = evt
      if (this.disabled || this.readonly || altKey || ctrlKey || metaKey) {
        return
      }
      if (arrayIncludes([UP, DOWN, HOME, END], keyCode)) {
        // https://w3c.github.io/aria-practices/#spinbutton
        evt.preventDefault()
        if (keyCode === UP) {
          this.increment()
        } else if (keyCode === DOWN) {
          this.decrement()
        } else if (keyCode === HOME) {
          this.localValue = this.computedMin
        } else if (keyCode === END) {
          this.localValue = this.computedMax
        }
      }
    }
  },
  render(h) {
    const idSpin = this.safeId()
    const value = this.localValue
    const isVertical = this.vertical
    const isInline = this.inline && !isVertical
    const isDisabled = this.disabled
    const isReadonly = this.readonly && !isDisabled
    const isRequired = this.required && !isReadonly && !isDisabled
    const state = this.state
    const hasValue = !isNull(value)
    const formatter = isFunction(this.formatterFn) ? this.formatterFn : () => this.formattedValue

    const makeButton = (handler, label, IconCmp, key) => {
      const $icon = h(IconCmp, {
        props: { scale: this.hasFocus ? 1.5 : 1.25 },
        attrs: { 'aria-hidden': 'true' }
      })
      return h(
        BButton,
        {
          key: key || null,
          staticClass: 'btn btn-sm border-0',
          class: { 'py-0': !isVertical },
          props: {
            variant: this.variant,
            disabled: isDisabled || isReadonly,
            block: isVertical
          },
          attrs: {
            tabindex: '-1',
            'aria-controls': idSpin,
            'aria-label': label || null
          },
          on: { click: handler }
        },
        [$icon]
      )
    }
    const $increment = makeButton(this.increment, this.labelIncrement, BIconPlus, 'inc')
    const $decrement = makeButton(this.decrement, this.labelDecrement, BIconDash, 'dec')

    let $hidden = h()
    if (this.name) {
      $hidden = h('input', {
        key: 'hidden',
        attrs: {
          type: 'hidden',
          name: this.name,
          form: this.form || null,
          // TODO:
          //   Should this be set to '' if value is out of range?
          value: hasValue ? value.toFixed(this.computedPrecision) : ''
        }
      })
    }

    const $spin = h(
      // we use 'output' element to make this accept a label for
      'output',
      {
        key: 'output',
        staticClass: 'border-0 px-1',
        class: {
          'flex-grow-1': !isVertical,
          'align-self-center': !isVertical,
          'py-1': isVertical
        },
        attrs: {
          id: idSpin,
          role: 'spinbutton',
          tabindex: isDisabled ? null : '0',
          'aria-live': 'off',
          'aria-label': this.ariaLabel || null,
          'aria-controls': this.ariaControls || null,
          // May want to check if the value is in range
          'aria-invalid': state === false || (!hasValue && isRequired) ? 'true' : null,
          'aria-required': isRequired ? 'true' : null,
          // These attrs are required for type spinbutton
          'aria-valuemin': toString(this.computedMin),
          'aria-valuemax': toString(this.computedMax),
          // These should be null if the value is out of range
          // They must also be non-existent attrs if the value is out of range or null
          'aria-valuenow': hasValue ? value : null,
          'aria-valuetext': hasValue ? formatter(value) : null
        }
      },
      hasValue ? formatter(value) : this.placeholder
    )

    return h(
      'div',
      {
        staticClass: 'b-form-spinbutton form-control p-1',
        class: {
          disabled: isDisabled,
          readonly: isReadonly,
          focus: this.hasFocus,
          'd-inline-flex': isInline || isVertical,
          'd-flex': !isInline && !isVertical,
          'h-auto': isVertical,
          'align-items-stretch': !isVertical,
          'flex-column': isVertical,
          'is-valid': state === true,
          'is-invalid': state === false
        },
        attrs: {
          role: 'group',
          ...this.$attrs
        },
        on: {
          keydown: this.onKeydown,
          // We use capture phase (`!` prefix) since focus/blur do not bubble
          '!focus': this.onFocusBlur,
          '!blur': this.onFocusBlur
        }
      },
      isVertical
        ? [$increment, $hidden, $spin, $decrement]
        : [$decrement, $hidden, $spin, $increment]
    )
  }
})
