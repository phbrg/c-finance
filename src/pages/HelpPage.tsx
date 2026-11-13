import { HelpQuestions } from '../components/help/HelpQuestions'
import { HelpSide } from '../components/help/HelpSide'

export function HelpPage() {
  return (
    <div className="page">
      <header className="page-header"><div><h1>Ajuda</h1><p>Respostas curtas sobre como o app funciona.</p></div></header>
      <div className="help-grid">
        <HelpQuestions />
        <HelpSide />
      </div>
    </div>
  )
}
