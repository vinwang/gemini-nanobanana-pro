import { redirect } from 'next/navigation'

/**
 * Redirect the root route to the image workspace.
 * @returns Nothing because Next.js stops rendering after redirect
 */
export default function HomePage() {
  redirect('/nano')
}
