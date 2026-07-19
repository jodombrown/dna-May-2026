
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	// ComposerCardPreview colors the live card from the active verb's bevel
	// token at runtime (`border-${token}` etc.), which the JIT scanner cannot
	// see. Safelist every class it can emit so the preview never loses its C
	// color in a production build.
	safelist: [
		...['bevel-connect', 'bevel-event', 'bevel-space', 'bevel-opportunity', 'bevel-story'].flatMap(
			(t) => [`border-${t}`, `text-${t}`, `bg-${t}`, `bg-${t}/10`, `bg-${t}/15`]
		),
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		screens: {
			'xs': '375px',
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
		},
		extend: {
		maxWidth: {
			// Drawer surface widths. A surface declares which it needs; the shell
			// applies it. DR1 shipped a single width for every surface and crushed
			// the composer from 860px to 448px.
			drawer: '28rem',        /* 448px — settings, account, nav-style surfaces */
			'drawer-wide': '860px', /* composing surfaces that need room to write */
		},
		fontFamily: {
			body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
			sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
			serif: ['Lora', 'Georgia', 'Times New Roman', 'serif'],
			heritage: ['Lora', 'Georgia', 'Times New Roman', 'serif'],
			display: ['Lora', 'Georgia', 'Times New Roman', 'serif'],
			ui: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
			mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
		},
		fontSize: {
			// DNA canonical type scale (see mem://style/typography-scale)
			hero: ['3rem', { lineHeight: '1.05', fontWeight: '600' }],          // 48px - marketing hero only
			display: ['2rem', { lineHeight: '1.15', fontWeight: '600' }],      // 32px - marketing hero
			h1: ['1.5rem', { lineHeight: '1.25', fontWeight: '600' }],          // 24px - page titles
			h2: ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],          // 20px - section headers
			h3: ['1rem', { lineHeight: '1.4', fontWeight: '600' }],             // 16px - card titles
			body: ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],       // 14px - default body
			meta: ['0.8125rem', { lineHeight: '1.45', fontWeight: '400' }],     // 13px - captions
			micro: ['0.6875rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.05em' }], // 11px eyebrows
		},
			height: {
				// Bottom-sheet height: leaves a strip of the underlying surface visible.
				sheet: '92vh',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// DNA Brand Identity Colors (Design System PRD)
				dna: {
					// Core Brand — Emerald
					emerald: {
						DEFAULT: 'hsl(var(--dna-emerald))',
						light: 'hsl(var(--dna-emerald-light))',
						dark: 'hsl(var(--dna-emerald-dark))',
						subtle: 'hsl(var(--dna-emerald-subtle, 153 31% 92%))',
					},
					// Five C's Module Colors
					connect: {
						DEFAULT: 'hsl(var(--module-connect))',
						light: 'hsl(var(--module-connect-light))',
						dark: 'hsl(var(--module-connect-dark))',
					},
					convene: {
						DEFAULT: 'hsl(var(--module-convene))',
						light: 'hsl(var(--module-convene-light))',
						dark: 'hsl(var(--module-convene-dark))',
					},
					collaborate: {
						DEFAULT: 'hsl(var(--module-collaborate))',
						light: 'hsl(var(--module-collaborate-light))',
						dark: 'hsl(var(--module-collaborate-dark))',
					},
					contribute: {
						DEFAULT: 'hsl(var(--module-contribute))',
						light: 'hsl(var(--module-contribute-light))',
						dark: 'hsl(var(--module-contribute-dark))',
					},
					convey: {
						DEFAULT: 'hsl(var(--module-convey))',
						light: 'hsl(var(--module-convey-light))',
						dark: 'hsl(var(--module-convey-dark))',
					},
					// DIA
					dia: {
						DEFAULT: 'hsl(var(--dna-dia))',
						light: 'hsl(var(--dna-dia-light))',
						glow: 'hsl(var(--dna-dia-glow))',
					},
					// Neutral palette (warm)
					cream: 'hsl(var(--dna-cream))',
					sand: {
						DEFAULT: 'hsl(var(--dna-sand))',
						light: 'hsl(var(--dna-sand-light))',
						dark: 'hsl(var(--dna-sand-dark))',
					},
					stone: 'hsl(var(--dna-stone))',
					gray400: 'hsl(var(--dna-gray400))',
					gray500: 'hsl(var(--dna-gray500))',
					gray600: 'hsl(var(--dna-gray600))',
					gray800: 'hsl(var(--dna-gray800))',
					black: 'hsl(var(--dna-black))',
					// Legacy colors (backward compat)
					forest: {
						DEFAULT: 'hsl(var(--dna-forest))',
						light: 'hsl(var(--dna-forest-light))',
						dark: 'hsl(var(--dna-forest-dark))',
					},
					terra: {
						DEFAULT: 'hsl(var(--dna-terra))',
						light: 'hsl(var(--dna-terra-light))',
						dark: 'hsl(var(--dna-terra-dark))',
					},
					ochre: {
						DEFAULT: 'hsl(var(--dna-ochre))',
						light: 'hsl(var(--dna-ochre-light))',
						dark: 'hsl(var(--dna-ochre-dark))',
					},
					sunset: {
						DEFAULT: 'hsl(var(--dna-sunset))',
						light: 'hsl(var(--dna-sunset-light))',
						dark: 'hsl(var(--dna-sunset-dark))',
					},
					purple: {
						DEFAULT: 'hsl(var(--dna-purple))',
						light: 'hsl(var(--dna-purple-light))',
						dark: 'hsl(var(--dna-purple-dark))',
					},
					copper: {
						DEFAULT: 'hsl(var(--dna-copper))',
						light: 'hsl(var(--dna-copper-light))',
						dark: 'hsl(var(--dna-copper-dark))',
					},
					gold: {
						DEFAULT: 'hsl(var(--dna-gold))',
						light: 'hsl(var(--dna-gold-light))',
						dark: 'hsl(var(--dna-gold-dark))',
					},
					mint: {
						DEFAULT: 'hsl(var(--dna-mint))',
						light: 'hsl(var(--dna-mint-light))',
						dark: 'hsl(var(--dna-mint-dark))',
					},
					crimson: {
						DEFAULT: 'hsl(var(--dna-crimson))',
						light: 'hsl(var(--dna-crimson-light))',
						dark: 'hsl(var(--dna-crimson-dark))',
					},
					earth: {
						DEFAULT: 'hsl(var(--dna-earth))',
						light: 'hsl(var(--dna-earth-light))',
						dark: 'hsl(var(--dna-earth-dark))',
					},
					ocean: {
						DEFAULT: 'hsl(var(--dna-ocean))',
						light: 'hsl(var(--dna-ocean-light))',
						dark: 'hsl(var(--dna-ocean-dark))',
					},
					slate: {
						DEFAULT: 'hsl(var(--dna-slate))',
						light: 'hsl(var(--dna-slate-light))',
						dark: 'hsl(var(--dna-slate-dark))',
					},
					pearl: {
						DEFAULT: 'hsl(var(--dna-pearl))',
						light: 'hsl(var(--dna-pearl-light))',
						dark: 'hsl(var(--dna-pearl-dark))',
					},
					charcoal: {
						DEFAULT: 'hsl(var(--dna-charcoal))',
						light: 'hsl(var(--dna-charcoal-light))',
						dark: 'hsl(var(--dna-charcoal-dark))',
					},
					// Semantic
					success: 'hsl(var(--dna-success))',
					warning: 'hsl(var(--dna-warning))',
					error: 'hsl(var(--dna-error))',
					info: 'hsl(var(--dna-info))',
				},
				// Feed Card Bevel Colors (BD083). Top-level on purpose: every
				// surface writes `bg-bevel-event` / `text-bevel-story` / …
				// Nesting this under `dna` silently renamed the whole palette
				// to `bg-dna-bevel-*` and left every card colorless.
				bevel: {
					post: 'hsl(var(--bevel-post))',
					connect: 'hsl(var(--bevel-connect))',
					story: 'hsl(var(--bevel-story))',
					event: 'hsl(var(--bevel-event))',
					space: 'hsl(var(--bevel-space))',
					opportunity: 'hsl(var(--bevel-opportunity))',
					need: 'hsl(var(--bevel-need))',
					offer: 'hsl(var(--bevel-offer))',
				},
				// Country Flag Colors
				morocco: {
					red: 'hsl(var(--morocco-red))',
					green: 'hsl(var(--morocco-green))'
				},
				egypt: {
					red: 'hsl(var(--egypt-red))',
					white: 'hsl(var(--egypt-white))',
					black: 'hsl(var(--egypt-black))'
				},
				algeria: {
					green: 'hsl(var(--algeria-green))'
				},
				tunisia: {
					red: 'hsl(var(--tunisia-red))'
				},
				libya: {
					green: 'hsl(var(--libya-green))',
					black: 'hsl(var(--libya-black))'
				},
				sudan: {
					red: 'hsl(var(--sudan-red))',
					white: 'hsl(var(--sudan-white))',
					black: 'hsl(var(--sudan-black))',
					green: 'hsl(var(--sudan-green))'
				},
				// ─── PHASE 3 TOKEN LOCK-IN — full 11-rung scales ───
				emerald: {
					50: 'hsl(var(--emerald-50))',
					100: 'hsl(var(--emerald-100))',
					200: 'hsl(var(--emerald-200))',
					300: 'hsl(var(--emerald-300))',
					400: 'hsl(var(--emerald-400))',
					500: 'hsl(var(--emerald-500))',
					600: 'hsl(var(--emerald-600))',
					700: 'hsl(var(--emerald-700))',
					800: 'hsl(var(--emerald-800))',
					900: 'hsl(var(--emerald-900))',
					950: 'hsl(var(--emerald-950))',
				},
				forest: {
					50: 'hsl(var(--forest-50))',
					100: 'hsl(var(--forest-100))',
					200: 'hsl(var(--forest-200))',
					300: 'hsl(var(--forest-300))',
					400: 'hsl(var(--forest-400))',
					500: 'hsl(var(--forest-500))',
					600: 'hsl(var(--forest-600))',
					700: 'hsl(var(--forest-700))',
					800: 'hsl(var(--forest-800))',
					900: 'hsl(var(--forest-900))',
					950: 'hsl(var(--forest-950))',
				},
				copper: {
					50: 'hsl(var(--copper-50))',
					100: 'hsl(var(--copper-100))',
					200: 'hsl(var(--copper-200))',
					300: 'hsl(var(--copper-300))',
					400: 'hsl(var(--copper-400))',
					500: 'hsl(var(--copper-500))',
					600: 'hsl(var(--copper-600))',
					700: 'hsl(var(--copper-700))',
					800: 'hsl(var(--copper-800))',
					900: 'hsl(var(--copper-900))',
					950: 'hsl(var(--copper-950))',
				},
				neutral: {
					50: 'hsl(var(--neutral-50))',
					100: 'hsl(var(--neutral-100))',
					200: 'hsl(var(--neutral-200))',
					300: 'hsl(var(--neutral-300))',
					400: 'hsl(var(--neutral-400))',
					500: 'hsl(var(--neutral-500))',
					600: 'hsl(var(--neutral-600))',
					700: 'hsl(var(--neutral-700))',
					800: 'hsl(var(--neutral-800))',
					900: 'hsl(var(--neutral-900))',
					950: 'hsl(var(--neutral-950))',
				},
				// Five C's tokens
				c: {
					connect: 'hsl(var(--c-connect))',
					convene: 'hsl(var(--c-convene))',
					collaborate: 'hsl(var(--c-collaborate))',
					contribute: 'hsl(var(--c-contribute))',
					convey: 'hsl(var(--c-convey))',
					dia: 'hsl(var(--c-dia))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',                       /* 8px */
				md: 'calc(var(--radius) - 2px)',           /* 6px */
				sm: 'calc(var(--radius) - 4px)',           /* 4px */
				xl: 'calc(var(--radius) + 4px)',           /* 12px — large CTAs / hero media only */
				'dna-sm': 'var(--radius-sm, 6px)',
				'dna-md': 'var(--radius-md, 10px)',
				'dna-lg': 'var(--radius-lg, 12px)',
				'dna-xl': 'var(--radius-xl, 16px)',
			},
			boxShadow: {
				'dna-1': 'var(--shadow-level1)',
				'dna-2': 'var(--shadow-level2)',
				'dna-3': 'var(--shadow-level3)',
				'dna-4': 'var(--shadow-level4)',
				'dna-inner': 'var(--shadow-inner)',
				'dna-focus': 'var(--shadow-focus)',
				'dna-glow': 'var(--shadow-glow)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
			'heartbeat': {
				'0%, 100%': {
					transform: 'scale(1)',
					opacity: '1'
				},
				'50%': {
					transform: 'scale(1.05)',
					opacity: '0.8'
				}
			},
			'badge-glow': {
				'0%, 100%': {
					transform: 'scale(1)',
					boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.4), 0 0 8px 2px rgba(22, 163, 74, 0.3)'
				},
				'50%': {
					transform: 'scale(1.03)',
					boxShadow: '0 6px 16px -2px rgba(0, 0, 0, 0.5), 0 0 16px 4px rgba(22, 163, 74, 0.5)'
				}
			},
				'breathing-pulse': {
					'0%': {
						transform: 'scale(1)',
					},
					'50%': {
						transform: 'scale(1.02)',
					},
					'100%': {
						transform: 'scale(1)',
					}
				},
				'breathing-pulse-staggered': {
					'0%': {
						transform: 'scale(1)',
						boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
					},
					'50%': {
						transform: 'scale(1.15)',
						boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)'
					},
					'100%': {
					transform: 'scale(1)',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
				}
			},
				'image-heartbeat': {
					'0%, 100%': {
						transform: 'scale(1)',
						boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
					},
					'50%': {
						transform: 'scale(1.02)',
						boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
					}
				},
				// Release Hero Animations
				'float': {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				},
				'slideInLeft': {
					'0%': {
						opacity: '0',
						transform: 'translateX(-20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'slideInRight': {
					'0%': {
						opacity: '0',
						transform: 'translateX(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'arrow-travel-right': {
					'0%': {
						left: '-8px',
						opacity: '0'
					},
					'20%': {
						opacity: '1'
					},
					'80%': {
						opacity: '1'
					},
					'100%': {
						left: 'calc(100% + 4px)',
						opacity: '0'
					}
				}
			},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out',
			'fade-in': 'fade-in 0.3s ease-out',
			'heartbeat': 'heartbeat 2s ease-in-out infinite',
			'heartbeat-delayed': 'heartbeat 2s ease-in-out infinite 1s',
			'heartbeat-delayed-2': 'heartbeat 2s ease-in-out infinite 2s',
			'breathing-pulse': 'breathing-pulse 1.5s ease-in-out forwards',
			'breathing-pulse-staggered': 'breathing-pulse-staggered 2s ease-in-out infinite',
			'image-heartbeat': 'image-heartbeat 2.5s ease-in-out infinite',
			'badge-glow': 'badge-glow 4s ease-in-out infinite',
			// Release Hero Animations
			'float': 'float 3s ease-in-out infinite',
			'slideInLeft': 'slideInLeft 0.5s ease-out forwards',
			'slideInRight': 'slideInRight 0.5s ease-out forwards',
			'arrow-travel-right': 'arrow-travel-right 1.5s ease-in-out infinite'
		}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
