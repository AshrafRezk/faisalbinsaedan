import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  IconButton,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slide,
} from '@mui/material'
import { MessageCircle, X, Send, Bed, Bath, Maximize, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useChatStore } from '../../lib/chatbot/store'
import { loadChatbotProjects } from '../../lib/chatbot/catalog'
import CurrencyIcon from '../ui/CurrencyIcon'
import { getUnitPriceBreakdown } from '../../lib/unitPrice'
import { BRAND_LOGO_SRC } from '../layout/BrandLogo'
import type { Unit } from '../../lib/types'

export default function SaraBot() {
  const { t, i18n } = useTranslation()
  const { 
    isOpen, 
    toggleChat, 
    messages, 
    currentStep, 
    inputType, 
    options, 
    handleOptionSelect, 
    handleTextInput,
    resetChat,
    selectUnitForInquiry,
    selectProjectForInquiry,
  } = useChatStore()
  
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const isRtl = i18n.language.startsWith('ar')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen, currentStep, options])

  useEffect(() => {
    if (isOpen) {
      void loadChatbotProjects()
    }
  }, [isOpen])

  const onSubmitText = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      handleTextInput(inputText)
      setInputText('')
    }
  }

  // Common regions in Saudi Arabia
  const saudiRegions = [
    'Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Qassim', 
    'Aseer', 'Tabuk', 'Hail', 'Northern Borders', 'Jazan', 'Najran', 'Al Baha', 'Al Jouf'
  ]

  const saudiRegionsAr = [
    'الرياض', 'مكة المكرمة', 'المدينة المنورة', 'المنطقة الشرقية', 'القصيم', 
    'عسير', 'تبوك', 'حائل', 'الحدود الشمالية', 'جازان', 'نجران', 'الباحة', 'الجوف'
  ]

  return (
    <>
      {/* Floating Action Button */}
      <Box sx={{
        position: 'fixed',
        bottom: { xs: 80, md: 30 },
        [isRtl ? 'left' : 'right']: { xs: 20, sm: 30 },
        zIndex: 9999
      }}>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <IconButton
            onClick={toggleChat}
            sx={{
              width: 60,
              height: 60,
              backgroundColor: '#102d4a',
              color: 'white',
              boxShadow: '0 8px 24px rgba(16, 45, 74, 0.4)',
              '&:hover': { backgroundColor: '#1e4670' }
            }}
          >
            {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
          </IconButton>
        </motion.div>
      </Box>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
            <Paper
              elevation={24}
              sx={{
                position: 'fixed',
                bottom: { xs: 150, md: 100 },
                [isRtl ? 'left' : 'right']: { xs: 20, sm: 30 },
                width: { xs: 'calc(100vw - 40px)', sm: 380 },
                height: { xs: 'calc(100vh - 190px)', sm: 600 },
                maxHeight: 700,
                zIndex: 9998,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 4,
                overflow: 'hidden',
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontFamily: isRtl ? "'PP Neue Montreal Arabic', system-ui, sans-serif" : "'PP Telegraf', system-ui, sans-serif"
              }}
            >
              {/* Header */}
              <Box sx={{
                bgcolor: '#102d4a',
                color: 'white',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 10
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      bgcolor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 0.4,
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      component="img"
                      src={BRAND_LOGO_SRC}
                      alt={t('chatbot.assistantName')}
                      sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1.25 }}>
                      {t('chatbot.assistantName')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
                      {isRtl ? 'متصل' : 'Online'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={toggleChat} sx={{ color: 'white' }}>
                  <X size={20} />
                </IconButton>
              </Box>

              {/* Messages Area */}
              <Box sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                bgcolor: '#f8fafc'
              }}>
                {messages.map((msg) => {
                  const isBot = msg.type === 'bot'
                  return (
                    <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          alignSelf: isBot ? (isRtl ? 'flex-end' : 'flex-start') : (isRtl ? 'flex-start' : 'flex-end'),
                          maxWidth: '85%'
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: isBot ? 'row' : 'row-reverse' }}>
                          {isBot && (
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                mt: 1,
                                flexShrink: 0,
                                borderRadius: 1,
                                bgcolor: 'white',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 0.25,
                              }}
                            >
                              <Box
                                component="img"
                                src={BRAND_LOGO_SRC}
                                alt=""
                                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            </Box>
                          )}
                          <Box sx={{
                            bgcolor: isBot ? 'white' : '#102d4a',
                            color: isBot ? '#1e293b' : 'white',
                            p: 1.5,
                            px: 2,
                            borderRadius: 3,
                            borderTopLeftRadius: isBot && !isRtl ? 4 : 24,
                            borderTopRightRadius: isBot && isRtl ? 4 : 24,
                            borderBottomRightRadius: !isBot && !isRtl ? 4 : 24,
                            borderBottomLeftRadius: !isBot && isRtl ? 4 : 24,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            typography: 'body2',
                            lineHeight: 1.6,
                          }}>
                            {msg.textKey ? t(msg.textKey) : msg.text}
                          </Box>
                        </Box>
                      </motion.div>

                      {msg.proposalUnits && msg.proposalUnits.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.15 }}
                          style={{
                            width: '100%',
                            alignSelf: 'stretch'
                          }}
                        >
                          <Box sx={{
                            display: 'flex',
                            gap: 1.5,
                            overflowX: 'auto',
                            py: 1,
                            px: 0.5,
                            scrollSnapType: 'x mandatory',
                            '&::-webkit-scrollbar': {
                              height: '6px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              backgroundColor: '#cbd5e1',
                              borderRadius: '3px',
                            }
                          }}>
                            {msg.proposalUnits.map((unit: Unit) => {
                              const { original, afterSubsidy, showBoth } = getUnitPriceBreakdown(unit)
                              const locale = isRtl ? 'ar-SA' : 'en-US'
                              const formatAmt = (n: number) =>
                                new Intl.NumberFormat(locale, {
                                  style: 'decimal',
                                  maximumFractionDigits: 0,
                                }).format(n)

                              return (
                                <Paper
                                  key={unit.id}
                                  elevation={2}
                                  sx={{
                                    minWidth: 230,
                                    maxWidth: 230,
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    border: '1px solid #e2e8f0',
                                    bgcolor: 'white',
                                    scrollSnapAlign: 'start',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }
                                  }}
                                >
                                  {/* Thumbnail */}
                                  <Box sx={{ position: 'relative', height: 110 }}>
                                    <img
                                      src={unit.images?.[0] || '/placeholder.jpg'}
                                      alt={unit.unitNumber}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <Box sx={{
                                      position: 'absolute',
                                      bottom: 8,
                                      [isRtl ? 'right' : 'left']: 8,
                                      bgcolor: 'rgba(16, 45, 74, 0.85)',
                                      color: 'white',
                                      px: 1,
                                      py: 0.25,
                                      borderRadius: 1,
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold'
                                    }}>
                                      {unit.unitNumber}
                                    </Box>
                                  </Box>

                                  {/* Details */}
                                  <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" noWrap color="#1e293b" sx={{ fontSize: '0.85rem' }}>
                                      {isRtl ? unit.projectNameAr || unit.projectName : unit.projectName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
                                      {isRtl ? unit.phaseNameAr || unit.phaseName : unit.phaseName}
                                    </Typography>

                                    {/* Price & Currency */}
                                    <Box sx={{ mt: 0.5 }}>
                                      {showBoth ? (
                                        <>
                                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              sx={{ fontSize: '0.7rem', textDecoration: 'line-through' }}
                                            >
                                              {formatAmt(original)}
                                            </Typography>
                                            <CurrencyIcon theme="light" style={{ height: '0.9em' }} />
                                          </Box>
                                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, mt: 0.25 }}>
                                            <Typography variant="body2" fontWeight="bold" color="#102d4a" sx={{ fontSize: '0.9rem' }}>
                                              {formatAmt(afterSubsidy)}
                                            </Typography>
                                            <CurrencyIcon theme="light" style={{ height: '1.15em' }} />
                                          </Box>
                                        </>
                                      ) : (
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
                                          <Typography variant="body2" fontWeight="bold" color="#102d4a" sx={{ fontSize: '0.9rem' }}>
                                            {formatAmt(original)}
                                          </Typography>
                                          <CurrencyIcon theme="light" style={{ height: '1.15em' }} />
                                        </Box>
                                      )}
                                    </Box>

                                    {/* Specifications */}
                                    <Box sx={{ display: 'flex', gap: 1.5, mt: 1, color: '#64748b' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                        <Bed size={13} />
                                        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>{unit.bedrooms}</Typography>
                                      </Box>
                                      {unit.bathrooms && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                          <Bath size={13} />
                                          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>{unit.bathrooms}</Typography>
                                        </Box>
                                      )}
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                        <Maximize size={13} />
                                        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                          {unit.area} {t('unit.areaUnit')}
                                        </Typography>
                                      </Box>
                                    </Box>

                                    {/* Buttons */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1.5 }}>
                                      <Button
                                        component={Link}
                                        to={`/unit/${unit.id}`}
                                        target="_blank"
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                          textTransform: 'none',
                                          fontSize: '0.7rem',
                                          py: 0.5,
                                          borderRadius: 1.5,
                                          color: '#102d4a',
                                          borderColor: '#102d4a',
                                          fontWeight: 'bold',
                                          '&:hover': { bgcolor: '#f1f5f9', borderColor: '#102d4a' }
                                        }}
                                      >
                                        {t('chatbot.unitCard.viewDetails')}
                                      </Button>
                                      <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => selectUnitForInquiry(unit)}
                                        sx={{
                                          textTransform: 'none',
                                          fontSize: '0.7rem',
                                          py: 0.5,
                                          borderRadius: 1.5,
                                          bgcolor: '#102d4a',
                                          color: 'white',
                                          fontWeight: 'bold',
                                          '&:hover': { bgcolor: '#1e4670' }
                                        }}
                                      >
                                        {t('chatbot.unitCard.interested')}
                                      </Button>
                                    </Box>
                                  </Box>
                                </Paper>
                              )
                            })}
                          </Box>
                        </motion.div>
                      )}

                      {msg.proposalProjects && msg.proposalProjects.length > 0 && (
                        <Box sx={{
                          display: 'flex',
                          gap: 1.5,
                          overflowX: 'auto',
                          py: 1,
                          px: 0.5,
                          scrollSnapType: 'x mandatory',
                          '&::-webkit-scrollbar': { height: '6px' },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#cbd5e1',
                            borderRadius: '3px',
                          }
                        }}>
                          {msg.proposalProjects.map((project) => {
                            const name = isRtl ? project.nameAr || project.name : project.name
                            const location = isRtl ? project.locationAr || project.location : project.location
                            const description = isRtl ? project.descriptionAr || project.description : project.description
                            return (
                              <Paper
                                key={project.id}
                                elevation={2}
                                sx={{
                                  minWidth: 230,
                                  maxWidth: 230,
                                  borderRadius: 3,
                                  overflow: 'hidden',
                                  border: '1px solid #e2e8f0',
                                  bgcolor: 'white',
                                  scrollSnapAlign: 'start',
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                              >
                                <Box sx={{ position: 'relative', height: 110, bgcolor: '#e2e8f0' }}>
                                  {project.coverImageUrl ? (
                                    <img
                                      src={project.coverImageUrl}
                                      alt={name}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                                      <Box component="img" src={BRAND_LOGO_SRC} alt="" sx={{ maxHeight: 64, maxWidth: '80%', objectFit: 'contain' }} />
                                    </Box>
                                  )}
                                </Box>
                                <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  <Typography variant="subtitle2" fontWeight="bold" noWrap color="#1e293b" sx={{ fontSize: '0.85rem' }}>
                                    {name}
                                  </Typography>
                                  {location && (
                                    <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                      <MapPin size={12} />
                                      {location}
                                    </Typography>
                                  )}
                                  {description && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        fontSize: '0.7rem',
                                        lineHeight: 1.4,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      {description}
                                    </Typography>
                                  )}
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 'auto', pt: 1 }}>
                                    <Button
                                      component={Link}
                                      to={`/project/${project.id}`}
                                      variant="outlined"
                                      size="small"
                                      sx={{
                                        textTransform: 'none',
                                        fontSize: '0.7rem',
                                        py: 0.5,
                                        borderRadius: 1.5,
                                        color: '#102d4a',
                                        borderColor: '#102d4a',
                                        fontWeight: 'bold',
                                        '&:hover': { bgcolor: '#f1f5f9', borderColor: '#102d4a' }
                                      }}
                                    >
                                      {t('chatbot.cta.viewProject')}
                                    </Button>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      onClick={() => selectProjectForInquiry(project)}
                                      sx={{
                                        textTransform: 'none',
                                        fontSize: '0.7rem',
                                        py: 0.5,
                                        borderRadius: 1.5,
                                        bgcolor: '#102d4a',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        '&:hover': { bgcolor: '#1e4670' }
                                      }}
                                    >
                                      {t('chatbot.cta.interested')}
                                    </Button>
                                  </Box>
                                </Box>
                              </Paper>
                            )
                          })}
                        </Box>
                      )}

                      {msg.links && msg.links.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, [isRtl ? 'pr' : 'pl']: 4.5 }}>
                          {msg.links.map((link) => (
                            <Button
                              key={link.to}
                              component={Link}
                              to={link.to}
                              variant="contained"
                              size="small"
                              sx={{
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                bgcolor: '#102d4a',
                                borderRadius: 4,
                                '&:hover': { bgcolor: '#1e4670' }
                              }}
                            >
                              {t(link.labelKey)}
                            </Button>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )
                })}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input Area */}
              <Box sx={{
                p: 2,
                bgcolor: 'white',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}>
                {inputType === 'options' && options.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
                    {options.map((opt) => (
                      <Button
                        key={opt.value}
                        variant="outlined"
                        size="small"
                        onClick={() => handleOptionSelect(opt.value)}
                        sx={{
                          borderRadius: 20,
                          textTransform: 'none',
                          color: '#102d4a',
                          borderColor: '#cbd5e1',
                          '&:hover': { bgcolor: '#f1f5f9', borderColor: '#102d4a' }
                        }}
                      >
                        {opt.labelKey
                          ? t(opt.labelKey)
                          : isRtl
                            ? opt.labelAr || opt.label
                            : opt.label || opt.labelAr}
                      </Button>
                    ))}
                  </Box>
                )}

                {(inputType === 'text' || inputType === 'phone' || ((currentStep === 'GREETING' || currentStep === 'PROJECTS_LIST') && inputType === 'options')) && (
                  <form onSubmit={onSubmitText} style={{ display: 'flex', gap: '8px' }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      placeholder={isRtl ? 'اكتب هنا...' : 'Type here...'}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      type={inputType === 'phone' ? 'tel' : 'text'}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 6,
                          bgcolor: '#f8fafc'
                        }
                      }}
                    />
                    <IconButton 
                      type="submit" 
                      disabled={!inputText.trim()}
                      sx={{ 
                        bgcolor: '#102d4a', 
                        color: 'white', 
                        borderRadius: 3,
                        '&:hover': { bgcolor: '#1e4670' },
                        '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }
                      }}
                    >
                      <Send size={20} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
                    </IconButton>
                  </form>
                )}

                {inputType === 'country_select' && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{isRtl ? 'رمز الدولة' : 'Country Code'}</InputLabel>
                      <Select
                        label={isRtl ? 'رمز الدولة' : 'Country Code'}
                        value={inputText || '+966'}
                        onChange={(e) => {
                          handleOptionSelect(e.target.value)
                        }}
                      >
                        <MenuItem value="+966">+966 (Saudi Arabia)</MenuItem>
                        <MenuItem value="+971">+971 (UAE)</MenuItem>
                        <MenuItem value="+965">+965 (Kuwait)</MenuItem>
                        <MenuItem value="+973">+973 (Bahrain)</MenuItem>
                        <MenuItem value="+974">+974 (Qatar)</MenuItem>
                        <MenuItem value="+968">+968 (Oman)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {inputType === 'region_select' && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(isRtl ? saudiRegionsAr : saudiRegions).map((region, idx) => (
                      <Button
                        key={region}
                        variant="outlined"
                        size="small"
                        onClick={() => handleOptionSelect(saudiRegions[idx])} // Always pass English value for backend
                        sx={{
                          borderRadius: 20,
                          textTransform: 'none',
                          color: '#102d4a',
                          borderColor: '#cbd5e1'
                        }}
                      >
                        {region}
                      </Button>
                    ))}
                  </Box>
                )}

                {currentStep === 'SUCCESS' && (
                  <Button variant="text" fullWidth onClick={resetChat}>
                    {isRtl ? 'بدء محادثة جديدة' : 'Start a new chat'}
                  </Button>
                )}
              </Box>

            </Paper>
          </Slide>
        )}
      </AnimatePresence>
    </>
  )
}
