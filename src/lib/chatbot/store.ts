import { create } from 'zustand'
import { Unit } from '../types'
import { mockUnits } from '../mock-data/units'
import { mockProjects } from '../mock-data/projects'

export type MessageType = 'bot' | 'user'
export type InputType = 'none' | 'text' | 'options' | 'country_select' | 'region_select' | 'phone'

export interface ChatMessage {
  id: string
  type: MessageType
  textKey?: string // i18n key for translation
  text?: string // raw text (for user input)
  proposalUnits?: Unit[] // optional units proposed to render in UI
}

export interface ChatOption {
  value: string
  labelKey: string
}

export type ConversationStep = 
  | 'GREETING'
  | 'ASK_NAME'
  | 'ASK_COUNTRY'
  | 'ASK_PHONE'
  | 'ASK_REGION'
  | 'ASK_CITY'
  | 'ASK_CUSTOMER_TYPE'
  | 'SUBMITTING'
  | 'SUCCESS'
  | 'ERROR'
  | 'PROPOSAL_LOCATION'
  | 'PROPOSAL_BUDGET'
  | 'PROPOSAL_BEDROOMS'

interface ChatState {
  isOpen: boolean
  messages: ChatMessage[]
  currentStep: ConversationStep
  inputType: InputType
  options: ChatOption[]
  leadData: {
    name: string
    country: string
    phone: string
    region: string
    city: string
    customerType: string
    selectedUnit?: string
    interestedProjectId?: string
    interestedUnitId?: string
    interestedPhaseId?: string
  }
  proposalFilters: {
    location: string
    budget: string
    bedrooms: string
  }
  
  // Actions
  toggleChat: () => void
  addMessage: (msg: Omit<ChatMessage, 'id'>) => void
  handleOptionSelect: (value: string) => void
  handleTextInput: (text: string) => void
  resetChat: () => void
  selectUnitForInquiry: (unit: Unit) => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  messages: [{ id: generateId(), type: 'bot', textKey: 'chatbot.greeting' }],
  currentStep: 'GREETING',
  inputType: 'options',
  options: [
    { value: 'projects', labelKey: 'chatbot.menu.projects' },
    { value: 'services', labelKey: 'chatbot.menu.services' },
    { value: 'contact', labelKey: 'chatbot.menu.contact' }
  ],
  leadData: { name: '', country: '+966', phone: '', region: '', city: '', customerType: '', selectedUnit: '' },
  proposalFilters: { location: '', budget: '', bedrooms: '' },

  toggleChat: () => set(state => ({ isOpen: !state.isOpen })),
  
  addMessage: (msg) => set(state => ({ 
    messages: [...state.messages, { ...msg, id: generateId() }] 
  })),

  handleOptionSelect: (value) => {
    const { addMessage, leadData } = get()
    
    // Find the translation key to show the user what they clicked
    const currentOptions = get().options
    const selectedOption = currentOptions.find(o => o.value === value)
    if (selectedOption) {
       addMessage({ type: 'user', textKey: selectedOption.labelKey })
    } else {
       addMessage({ type: 'user', text: value })
    }

    const step = get().currentStep

    if (step === 'GREETING') {
      if (value === 'projects') {
        addMessage({
          type: 'bot',
          textKey: 'chatbot.greeting' // just small message asking what to do
        })
        set({
          options: [
            { value: 'find_unit', labelKey: 'chatbot.menu.findUnit' },
            { value: 'browse_all', labelKey: 'chatbot.menu.browseAll' }
          ]
        })
      } else if (value === 'browse_all') {
        addMessage({ type: 'bot', textKey: 'chatbot.link.projects' })
        set({
          options: [
            { value: 'projects', labelKey: 'chatbot.menu.projects' },
            { value: 'services', labelKey: 'chatbot.menu.services' },
            { value: 'contact', labelKey: 'chatbot.menu.contact' }
          ]
        })
      } else if (value === 'find_unit') {
        addMessage({ type: 'bot', textKey: 'chatbot.findUnitIntro' })
        set({
          currentStep: 'PROPOSAL_LOCATION',
          inputType: 'options',
          options: [
            { value: 'Riyadh', labelKey: 'chatbot.location.riyadh' },
            { value: 'KAEC', labelKey: 'chatbot.location.kaec' },
            { value: 'any', labelKey: 'chatbot.location.any' }
          ]
        })
      } else if (value === 'services') {
        addMessage({ type: 'bot', textKey: 'chatbot.link.services' })
        set({
          options: [
            { value: 'projects', labelKey: 'chatbot.menu.projects' },
            { value: 'services', labelKey: 'chatbot.menu.services' },
            { value: 'contact', labelKey: 'chatbot.menu.contact' }
          ]
        })
      } else if (value === 'contact') {
        addMessage({ type: 'bot', textKey: 'chatbot.askName' })
        set({ currentStep: 'ASK_NAME', inputType: 'text', options: [] })
      }
    } else if (step === 'PROPOSAL_LOCATION') {
      const filters = get().proposalFilters
      set({ proposalFilters: { ...filters, location: value } })
      addMessage({ type: 'bot', textKey: 'chatbot.askBudget' })
      set({
        currentStep: 'PROPOSAL_BUDGET',
        inputType: 'options',
        options: [
          { value: 'under_1_5m', labelKey: 'chatbot.budget.under_1_5m' },
          { value: 'between_1_5m_3m', labelKey: 'chatbot.budget.between_1_5m_3m' },
          { value: 'above_3m', labelKey: 'chatbot.budget.above_3m' },
          { value: 'any', labelKey: 'chatbot.budget.any' }
        ]
      })
    } else if (step === 'PROPOSAL_BUDGET') {
      const filters = get().proposalFilters
      set({ proposalFilters: { ...filters, budget: value } })
      addMessage({ type: 'bot', textKey: 'chatbot.askBedrooms' })
      set({
        currentStep: 'PROPOSAL_BEDROOMS',
        inputType: 'options',
        options: [
          { value: '2', labelKey: 'chatbot.bedrooms.two' },
          { value: '3', labelKey: 'chatbot.bedrooms.three' },
          { value: '4_plus', labelKey: 'chatbot.bedrooms.four_plus' },
          { value: 'any', labelKey: 'chatbot.bedrooms.any' }
        ]
      })
    } else if (step === 'PROPOSAL_BEDROOMS') {
      const filters = { ...get().proposalFilters, bedrooms: value }
      set({ proposalFilters: filters })
      
      const availableUnits = mockUnits.filter(unit => unit.status === 'Available')
      
      const matched = availableUnits.filter(unit => {
        // Location matching
        if (filters.location !== 'any') {
          const project = mockProjects.find(p => p.id === unit.projectId)
          if (!project) return false
          const isRiyadh = project.location.toLowerCase().includes('riyadh')
          const isKaec = project.location.toLowerCase().includes('economic') || project.location.toLowerCase().includes('kaec')
          
          if (filters.location === 'Riyadh' && !isRiyadh) return false
          if (filters.location === 'KAEC' && !isKaec) return false
        }
        
        // Budget matching
        if (filters.budget !== 'any') {
          if (filters.budget === 'under_1_5m' && unit.price >= 1500000) return false
          if (filters.budget === 'between_1_5m_3m' && (unit.price < 1500000 || unit.price > 3000000)) return false
          if (filters.budget === 'above_3m' && unit.price <= 3000000) return false
        }
        
        // Bedrooms matching
        if (filters.bedrooms !== 'any') {
          if (filters.bedrooms === '2' && unit.bedrooms !== 2) return false
          if (filters.bedrooms === '3' && unit.bedrooms !== 3) return false
          if (filters.bedrooms === '4_plus' && unit.bedrooms < 4) return false
        }
        
        return true
      })
      
      const maxResults = 3
      if (matched.length > 0) {
        const results = matched.slice(0, maxResults)
        addMessage({
          type: 'bot',
          textKey: 'chatbot.proposalsFound',
          proposalUnits: results
        })
      } else {
        const fallbacks = availableUnits.slice(0, maxResults)
        addMessage({
          type: 'bot',
          textKey: 'chatbot.noProposalsFound',
          proposalUnits: fallbacks
        })
      }
      
      set({
        currentStep: 'GREETING',
        inputType: 'options',
        options: [
          { value: 'contact', labelKey: 'chatbot.menu.contact' },
          { value: 'find_unit', labelKey: 'chatbot.menu.findUnit' },
          { value: 'services', labelKey: 'chatbot.menu.services' }
        ]
      })
    } else if (step === 'ASK_COUNTRY') {
      set({ leadData: { ...leadData, country: value } })
      addMessage({ type: 'bot', textKey: 'chatbot.askPhone' })
      set({ currentStep: 'ASK_PHONE', inputType: 'phone', options: [] })
    } else if (step === 'ASK_REGION') {
      set({ leadData: { ...leadData, region: value } })
      addMessage({ type: 'bot', textKey: 'chatbot.askCity' })
      set({ currentStep: 'ASK_CITY', inputType: 'text', options: [] })
    } else if (step === 'ASK_CUSTOMER_TYPE') {
      set({ leadData: { ...leadData, customerType: value } })
      addMessage({ type: 'bot', textKey: 'chatbot.submitting' })
      set({ currentStep: 'SUBMITTING', inputType: 'none', options: [] })
      
      submitLeadToSalesforce()
    }
  },

  handleTextInput: (text) => {
    if (!text.trim()) return
    const { addMessage, leadData, currentStep } = get()
    
    addMessage({ type: 'user', text })

    if (currentStep === 'ASK_NAME') {
      set({ leadData: { ...leadData, name: text } })
      addMessage({ type: 'bot', textKey: 'chatbot.askCountry' })
      set({ currentStep: 'ASK_COUNTRY', inputType: 'country_select', options: [] })
    } else if (currentStep === 'ASK_PHONE') {
      set({ leadData: { ...leadData, phone: text } })
      addMessage({ type: 'bot', textKey: 'chatbot.askRegion' })
      set({ currentStep: 'ASK_REGION', inputType: 'region_select', options: [] })
    } else if (currentStep === 'ASK_CITY') {
      set({ leadData: { ...leadData, city: text } })
      addMessage({ type: 'bot', textKey: 'chatbot.askCustomerType' })
      set({ 
        currentStep: 'ASK_CUSTOMER_TYPE', 
        inputType: 'options', 
        options: [
          { value: 'Individual', labelKey: 'chatbot.customerType.individual' },
          { value: 'Company', labelKey: 'chatbot.customerType.company' }
        ] 
      })
    }
  },

  selectUnitForInquiry: (unit) => {
    const { addMessage } = get()
    
    addMessage({
      type: 'user',
      text: `Interested in Unit ${unit.unitNumber} (${unit.projectName})`
    })
    
    addMessage({
      type: 'bot',
      textKey: 'chatbot.askName'
    })
    
    set(state => ({
      currentStep: 'ASK_NAME',
      inputType: 'text',
      options: [],
      leadData: {
        ...state.leadData,
        selectedUnit: `Unit ${unit.unitNumber} (${unit.projectName})`,
        interestedProjectId: unit.projectId,
        interestedUnitId: unit.id,
        interestedPhaseId: unit.phaseId
      }
    }))
  },

  resetChat: () => set({
    messages: [{ id: generateId(), type: 'bot', textKey: 'chatbot.greeting' }],
    currentStep: 'GREETING',
    inputType: 'options',
    options: [
      { value: 'projects', labelKey: 'chatbot.menu.projects' },
      { value: 'services', labelKey: 'chatbot.menu.services' },
      { value: 'contact', labelKey: 'chatbot.menu.contact' }
    ],
    leadData: { name: '', country: '+966', phone: '', region: '', city: '', customerType: '', selectedUnit: '' },
    proposalFilters: { location: '', budget: '', bedrooms: '' }
  })
}))

async function submitLeadToSalesforce() {
  const store = useChatStore.getState()
  const payload = store.leadData
  
  try {
    const res = await fetch('/api/salesforce-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (data.success) {
      useChatStore.getState().addMessage({ type: 'bot', textKey: 'chatbot.success' })
      useChatStore.setState({ currentStep: 'SUCCESS', inputType: 'none', options: [] })
    } else {
      useChatStore.getState().addMessage({ type: 'bot', textKey: 'chatbot.error' })
      useChatStore.setState({ currentStep: 'ERROR', inputType: 'options', options: [{ value: 'contact', labelKey: 'chatbot.retry' }] })
    }
  } catch (err) {
    useChatStore.getState().addMessage({ type: 'bot', textKey: 'chatbot.error' })
    useChatStore.setState({ currentStep: 'ERROR', inputType: 'options', options: [{ value: 'contact', labelKey: 'chatbot.retry' }] })
  }
}
