import { useState } from 'react'

export default function ChatEditStub({ placeholder }: { placeholder: string }) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  const send = () => {
    if (!text.trim()) return
    setSent(true)
    setText('')
  }

  return (
    <div className="chat-stub">
      <textarea
        value={text}
        placeholder={placeholder}
        rows={2}
        onChange={(e) => {
          setText(e.target.value)
          setSent(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send()
          }
        }}
      />
      <div className="chat-stub-foot">
        <span className="chat-stub-note">{sent ? 'Demo 占位：对话编辑将在后续版本开放' : ''}</span>
        <button onClick={send}>发送</button>
      </div>
    </div>
  )
}
