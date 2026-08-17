import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
} from '@mui/material'
import { X, Trash2 } from 'lucide-react'
import { Unit } from '../../lib/types'
import { getUnitOriginalPrice, getUnitDisplayPrice } from '../../lib/unitPrice'
import UnitCard from '../search/UnitCard'
import ShareButton from '../ui/ShareButton'
import CurrencyIcon from '../ui/CurrencyIcon'

interface UnitComparisonProps {
  units: Unit[]
  isOpen: boolean
  onClose: () => void
  onRemove: (unitId: string) => void
}

export default function UnitComparison({ units, isOpen, onClose, onRemove }: UnitComparisonProps) {
  const formatPrice = (price: number) => {
    const formatted = new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(price)
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {formatted}
        <CurrencyIcon theme="light" className="mx-1" />
      </Box>
    )
  }

  const comparisonFields = [
    { key: 'priceBefore', label: 'السعر قبل الدعم', format: (unit: Unit) => formatPrice(getUnitOriginalPrice(unit)) },
    { key: 'priceAfter', label: 'السعر بعد الدعم', format: (unit: Unit) => (
      unit.eligibleForSubsidies ? formatPrice(getUnitDisplayPrice(unit)) : '—'
    ) },
    { key: 'bedrooms', label: 'الغرف', format: (unit: Unit) => `${unit.bedrooms} غرف` },
    { key: 'bathrooms', label: 'الحمامات', format: (unit: Unit) => unit.bathrooms || 'N/A' },
    { key: 'area', label: 'المساحة', format: (unit: Unit) => `${unit.area} م²` },
    { key: 'status', label: 'الحالة', format: (unit: Unit) => getStatusLabel(unit.status) },
    { key: 'deliveryDate', label: 'التسليم', format: (unit: Unit) => formatDate(unit.deliveryDate) },
    { key: 'project', label: 'المشروع', format: (unit: Unit) => unit.projectNameAr },
    { key: 'phase', label: 'المرحلة', format: (unit: Unit) => unit.phaseNameAr },
  ]

  const getStatusLabel = (status: Unit['status']) => {
    const labels: Record<Unit['status'], string> = {
      Available: 'متاح',
      Reserved: 'محجوز',
      Sold: 'مباع',
    }
    return labels[status]
  }

  const getStatusColor = (status: Unit['status']) => {
    const colors: Record<Unit['status'], 'success' | 'warning' | 'error'> = {
      Available: 'success',
      Reserved: 'warning',
      Sold: 'error',
    }
    return colors[status]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
    })
  }

  if (units.length === 0) {
    return null
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">مقارنة الوحدات ({units.length})</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ShareButton
              url={window.location.href}
              title="مقارنة الوحدات"
              text={`أقارن ${units.length} وحدات`}
            />
            <IconButton onClick={onClose} size="small">
              <X size={20} />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>المعيار</TableCell>
                {units.map((unit) => (
                  <TableCell key={unit.id} align="center" sx={{ position: 'relative' }}>
                    <IconButton
                      size="small"
                      onClick={() => onRemove(unit.id)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        color: 'error.main',
                      }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                    <Box sx={{ pt: 3 }}>
                      <Typography variant="body2" fontWeight="semibold">
                        {unit.unitNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {comparisonFields.map((field) => (
                <TableRow key={field.key}>
                  <TableCell sx={{ fontWeight: 'medium' }}>{field.label}</TableCell>
                  {units.map((unit) => (
                    <TableCell key={unit.id} align="center">
                      {field.key === 'status' ? (
                        <Chip
                          label={field.format(unit)}
                          color={getStatusColor(unit.status)}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2">{field.format(unit)}</Typography>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onClose}>
            إغلاق
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              // Clear all comparisons
              units.forEach((unit) => onRemove(unit.id))
            }}
            color="error"
          >
            مسح الكل
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

