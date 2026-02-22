'use client'
import { useEffect } from 'react'

export function FilledInputBackground() {
    useEffect(() => {
        const updateClass = (el: HTMLElement) => {
            const input = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            const val = input.value
            if (val) {
                el.classList.add('bg-[#fbfcfd]')
                el.classList.remove('bg-white')
            } else {
                el.classList.add('bg-white')
                el.classList.remove('bg-[#fbfcfd]')
            }
        }

        const handleInput = (e: Event) => {
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
                updateClass(target)
            }
        }

        // Delay slightly to let React mount and set defaultValue
        const timer = setTimeout(() => {
            document.querySelectorAll('input:not([type="hidden"]):not([type="file"]), select, textarea').forEach(el => {
                updateClass(el as HTMLElement)
            })
        }, 50)

        // Attach global listeners
        document.addEventListener('input', handleInput)
        document.addEventListener('change', handleInput)

        return () => {
            clearTimeout(timer)
            document.removeEventListener('input', handleInput)
            document.removeEventListener('change', handleInput)
        }
    }, [])

    return null
}
