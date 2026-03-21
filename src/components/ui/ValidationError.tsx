interface ValidationErrorProps {
  message: string
}

export function ValidationError({ message }: ValidationErrorProps): React.JSX.Element | null {
  if (!message) return null
  return <p className="text-sm text-red-600">{message}</p>
}
