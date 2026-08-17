import { create } from 'zustand'
import { Unit } from '../types'
import {
  loadChatbotProjects,
  locationOptionsFromProjects,
  findMatchingProjects,
  isProjectIntent,
  projectToCard,
  searchMatchingUnits,
  type ChatProjectCard,
} from './catalog'

export type MessageType = 'bot' | 'user'
export type InputType = 'none' | 'text' | 'options' | 'country_select' | 'region_select' | 'phone'

export interface ChatLink {
  to: string
  labelKey: string
}

export interface ChatMessage {
  id: string
  type: MessageType
  textKey?: string
  text?: string
  proposalUnits?: Unit[]
  proposalProjects?: ChatProjectCard[]
  links?: ChatLink[]
}

export interface ChatOption {
  value: string
  labelKey?: string
  label?: string
  labelAr?: string
}

export type ConversationStep =
  | 'GREETING'
  | 'PROJECTS_LIST'
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

  toggleChat: () => void
  addMessage: (msg: Omit<ChatMessage, 'id'>) => void
  handleOptionSelect: (value: string) => void
  handleTextInput: (text: string) => void
  resetChat: () => void
  selectUnitForInquiry: (unit: Unit) => void
  selectProjectForInquiry: (project: ChatProjectCard) => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const MAIN_MENU: ChatOption[] = [
  { value: 'projects', labelKey: 'chatbot.menu.projects' },
  { value: 'services', labelKey: 'chatbot.menu.services' },
  { value: 'contact', labelKey: 'chatbot.menu.contact' },
]

const PROJECT_FOLLOW_UP: ChatOption[] = [
  { value: 'projects', labelKey: 'chatbot.menu.moreProjects' },
  { value: 'find_unit', labelKey: 'chatbot.menu.findUnit' },
  { value: 'browse_all', labelKey: 'chatbot.menu.browseAll' },
  { value: 'contact', labelKey: 'chatbot.menu.contact' },
]

function emptyLead() {
  return { name: '', country: '+966', phone: '', region: '', city: '', customerType: '', selectedUnit: '' }
}

function projectOption(project: ChatProjectCard): ChatOption {
  return {
    value: `project:${project.id}`,
    label: project.name,
    labelAr: project.nameAr,
  }
}

export const useChatStore = create<ChatState>((set, get) => {
  const addMessage = (msg: Omit<ChatMessage, 'id'>) => {
    set((state) => ({
      messages: [...state.messages, { ...msg, id: generateId() }],
    }))
  }

  const setMainMenu = (step: ConversationStep = 'GREETING') => {
    set({
      currentStep: step,
      inputType: 'options',
      options: MAIN_MENU,
    })
  }

  const presentProjects = async (botTextKey: string) => {
    addMessage({ type: 'bot', textKey: 'chatbot.projectsLoading' })
    set({ currentStep: 'PROJECTS_LIST', inputType: 'none', options: [] })

    const projects = await loadChatbotProjects()
    const cards = projects.map(projectToCard)

    if (cards.length === 0) {
      addMessage({
        type: 'bot',
        textKey: 'chatbot.projectsEmpty',
        links: [{ to: '/residential-projects', labelKey: 'chatbot.cta.browseResidential' }],
      })
      set({
        currentStep: 'GREETING',
        inputType: 'options',
        options: [
          { value: 'find_unit', labelKey: 'chatbot.menu.findUnit' },
          { value: 'contact', labelKey: 'chatbot.menu.contact' },
        ],
      })
      return
    }

    addMessage({
      type: 'bot',
      textKey: botTextKey,
      proposalProjects: cards,
      links: [{ to: '/residential-projects', labelKey: 'chatbot.cta.browseResidential' }],
    })
    set({
      currentStep: 'PROJECTS_LIST',
      inputType: 'options',
      options: [
        ...(cards.length <= 6 ? cards.map(projectOption) : []),
        { value: 'find_unit', labelKey: 'chatbot.menu.findUnit' },
        { value: 'browse_all', labelKey: 'chatbot.menu.browseAll' },
      ],
    })
  }

  const presentProjectDetails = (project: ChatProjectCard) => {
    addMessage({
      type: 'bot',
      textKey: 'chatbot.projectDetailsIntro',
      proposalProjects: [project],
    })
    set({
      currentStep: 'PROJECTS_LIST',
      inputType: 'options',
      options: PROJECT_FOLLOW_UP,
    })
  }

  const startFindUnit = async () => {
    addMessage({ type: 'bot', textKey: 'chatbot.findUnitIntro' })
    const projects = await loadChatbotProjects()
    const locations = locationOptionsFromProjects(projects)
    set({
      currentStep: 'PROPOSAL_LOCATION',
      inputType: 'options',
      options: [
        ...locations.map((loc) => ({
          value: loc.value,
          label: loc.label,
          labelAr: loc.labelAr,
        })),
        { value: 'any', labelKey: 'chatbot.location.any' },
      ],
    })
  }

  const browseAllProjects = () => {
    addMessage({
      type: 'bot',
      textKey: 'chatbot.link.projects',
      links: [{ to: '/residential-projects', labelKey: 'chatbot.cta.browseResidential' }],
    })
    setMainMenu()
  }

  const startContact = () => {
    addMessage({ type: 'bot', textKey: 'chatbot.askName' })
    set({ currentStep: 'ASK_NAME', inputType: 'text', options: [] })
  }

  const handleProjectRelated = async (value: string) => {
    if (value.startsWith('project:')) {
      const id = value.slice('project:'.length)
      const projects = await loadChatbotProjects()
      const match = projects.find((p) => p.id === id)
      if (match) {
        presentProjectDetails(projectToCard(match))
      } else {
        addMessage({ type: 'bot', textKey: 'chatbot.projectsEmpty' })
        setMainMenu()
      }
      return true
    }

    if (value === 'projects') {
      await presentProjects('chatbot.projectsIntro')
      return true
    }

    if (value === 'browse_all') {
      browseAllProjects()
      return true
    }

    if (value === 'find_unit') {
      await startFindUnit()
      return true
    }

    if (value === 'services') {
      addMessage({
        type: 'bot',
        textKey: 'chatbot.link.services',
        links: [{ to: '/about-us', labelKey: 'chatbot.cta.aboutUs' }],
      })
      setMainMenu()
      return true
    }

    if (value === 'contact') {
      startContact()
      return true
    }

    return false
  }

  return {
    isOpen: false,
    messages: [{ id: generateId(), type: 'bot', textKey: 'chatbot.greeting' }],
    currentStep: 'GREETING',
    inputType: 'options',
    options: MAIN_MENU,
    leadData: emptyLead(),
    proposalFilters: { location: '', budget: '', bedrooms: '' },

    toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

    addMessage,

    handleOptionSelect: (value) => {
      const { leadData, currentStep, options } = get()

      const selectedOption = options.find((o) => o.value === value)
      if (selectedOption?.labelKey) {
        addMessage({ type: 'user', textKey: selectedOption.labelKey })
      } else if (selectedOption?.label || selectedOption?.labelAr) {
        addMessage({ type: 'user', text: selectedOption.label || selectedOption.labelAr })
      } else {
        addMessage({ type: 'user', text: value })
      }

      void (async () => {
        if (currentStep === 'GREETING' || currentStep === 'PROJECTS_LIST' || currentStep === 'ERROR') {
          const handled = await handleProjectRelated(value)
          if (handled) return
        }

        if (currentStep === 'PROPOSAL_LOCATION') {
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
              { value: 'any', labelKey: 'chatbot.budget.any' },
            ],
          })
          return
        }

        if (currentStep === 'PROPOSAL_BUDGET') {
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
              { value: 'any', labelKey: 'chatbot.bedrooms.any' },
            ],
          })
          return
        }

        if (currentStep === 'PROPOSAL_BEDROOMS') {
          const filters = { ...get().proposalFilters, bedrooms: value }
          set({ proposalFilters: filters, currentStep: 'PROJECTS_LIST', inputType: 'none', options: [] })
          addMessage({ type: 'bot', textKey: 'chatbot.searchingUnits' })

          const results = await searchMatchingUnits(filters)
          if (results.length > 0) {
            addMessage({
              type: 'bot',
              textKey: 'chatbot.proposalsFound',
              proposalUnits: results,
            })
          } else {
            addMessage({
              type: 'bot',
              textKey: 'chatbot.noProposalsFound',
              links: [{ to: '/search', labelKey: 'chatbot.cta.searchUnits' }],
            })
          }

          set({
            currentStep: 'GREETING',
            inputType: 'options',
            options: [
              { value: 'contact', labelKey: 'chatbot.menu.contact' },
              { value: 'find_unit', labelKey: 'chatbot.menu.findUnit' },
              { value: 'projects', labelKey: 'chatbot.menu.projects' },
            ],
          })
          return
        }

        if (currentStep === 'ASK_COUNTRY') {
          set({ leadData: { ...leadData, country: value } })
          addMessage({ type: 'bot', textKey: 'chatbot.askPhone' })
          set({ currentStep: 'ASK_PHONE', inputType: 'phone', options: [] })
          return
        }

        if (currentStep === 'ASK_REGION') {
          set({ leadData: { ...leadData, region: value } })
          addMessage({ type: 'bot', textKey: 'chatbot.askCity' })
          set({ currentStep: 'ASK_CITY', inputType: 'text', options: [] })
          return
        }

        if (currentStep === 'ASK_CUSTOMER_TYPE') {
          set({ leadData: { ...leadData, customerType: value } })
          addMessage({ type: 'bot', textKey: 'chatbot.submitting' })
          set({ currentStep: 'SUBMITTING', inputType: 'none', options: [] })
          submitLeadToSalesforce()
        }
      })()
    },

    handleTextInput: (text) => {
      if (!text.trim()) return
      const { leadData, currentStep } = get()

      addMessage({ type: 'user', text })

      void (async () => {
        if (currentStep === 'GREETING' || currentStep === 'PROJECTS_LIST') {
          const projects = await loadChatbotProjects()
          const matches = findMatchingProjects(text, projects)

          if (matches.length === 1) {
            presentProjectDetails(projectToCard(matches[0]))
            return
          }

          if (matches.length > 1) {
            const cards = matches.map(projectToCard)
            addMessage({
              type: 'bot',
              textKey: 'chatbot.projectsMatched',
              proposalProjects: cards,
            })
            set({
              currentStep: 'PROJECTS_LIST',
              inputType: 'options',
              options: [...cards.map(projectOption), { value: 'browse_all', labelKey: 'chatbot.menu.browseAll' }],
            })
            return
          }

          if (isProjectIntent(text)) {
            await presentProjects('chatbot.projectsIntro')
            return
          }

          addMessage({ type: 'bot', textKey: 'chatbot.didNotUnderstand' })
          setMainMenu()
          return
        }

        if (currentStep === 'ASK_NAME') {
          set({ leadData: { ...leadData, name: text } })
          addMessage({ type: 'bot', textKey: 'chatbot.askCountry' })
          set({ currentStep: 'ASK_COUNTRY', inputType: 'country_select', options: [] })
          return
        }

        if (currentStep === 'ASK_PHONE') {
          set({ leadData: { ...leadData, phone: text } })
          addMessage({ type: 'bot', textKey: 'chatbot.askRegion' })
          set({ currentStep: 'ASK_REGION', inputType: 'region_select', options: [] })
          return
        }

        if (currentStep === 'ASK_CITY') {
          set({ leadData: { ...leadData, city: text } })
          addMessage({ type: 'bot', textKey: 'chatbot.askCustomerType' })
          set({
            currentStep: 'ASK_CUSTOMER_TYPE',
            inputType: 'options',
            options: [
              { value: 'Individual', labelKey: 'chatbot.customerType.individual' },
              { value: 'Company', labelKey: 'chatbot.customerType.company' },
            ],
          })
        }
      })()
    },

    selectUnitForInquiry: (unit) => {
      addMessage({
        type: 'user',
        text: `Interested in Unit ${unit.unitNumber} (${unit.projectName})`,
      })
      addMessage({ type: 'bot', textKey: 'chatbot.askName' })
      set((state) => ({
        currentStep: 'ASK_NAME',
        inputType: 'text',
        options: [],
        leadData: {
          ...state.leadData,
          selectedUnit: `Unit ${unit.unitNumber} (${unit.projectName})`,
          interestedProjectId: unit.projectId,
          interestedUnitId: unit.id,
          interestedPhaseId: unit.phaseId,
        },
      }))
    },

    selectProjectForInquiry: (project) => {
      addMessage({
        type: 'user',
        text: project.name,
      })
      addMessage({ type: 'bot', textKey: 'chatbot.askName' })
      set((state) => ({
        currentStep: 'ASK_NAME',
        inputType: 'text',
        options: [],
        leadData: {
          ...state.leadData,
          selectedUnit: project.name,
          interestedProjectId: project.id,
        },
      }))
    },

    resetChat: () =>
      set({
        messages: [{ id: generateId(), type: 'bot', textKey: 'chatbot.greeting' }],
        currentStep: 'GREETING',
        inputType: 'options',
        options: MAIN_MENU,
        leadData: emptyLead(),
        proposalFilters: { location: '', budget: '', bedrooms: '' },
      }),
  }
})

async function submitLeadToSalesforce() {
  const store = useChatStore.getState()
  const payload = store.leadData

  try {
    const res = await fetch('/api/salesforce-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.success) {
      useChatStore.getState().addMessage({ type: 'bot', textKey: 'chatbot.success' })
      useChatStore.setState({ currentStep: 'SUCCESS', inputType: 'none', options: [] })
    } else {
      useChatStore.getState().addMessage({ type: 'bot', textKey: 'chatbot.error' })
      useChatStore.setState({
        currentStep: 'ERROR',
        inputType: 'options',
        options: [{ value: 'contact', labelKey: 'chatbot.retry' }],
      })
    }
  } catch {
    useChatStore.getState().addMessage({ type: 'bot', textKey: 'chatbot.error' })
    useChatStore.setState({
      currentStep: 'ERROR',
      inputType: 'options',
      options: [{ value: 'contact', labelKey: 'chatbot.retry' }],
    })
  }
}
