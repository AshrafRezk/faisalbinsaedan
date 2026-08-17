import { Box, Link, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

type SupplierPdfPreviewProps = {
  url: string
  title: string
}

export default function SupplierPdfPreview({ url, title }: SupplierPdfPreviewProps) {
  const { t } = useTranslation()

  return (
    <Box sx={{ mt: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {t('contact.supplierPdfPreview')}
        </Typography>
        <Link href={url} target="_blank" rel="noopener noreferrer" variant="caption">
          {t('contact.supplierPdfOpenInNewTab')}
        </Link>
      </Box>
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          height: { xs: 320, sm: 420 },
          bgcolor: 'grey.100',
        }}
      >
        <Box
          component="iframe"
          src={url}
          title={title}
          sx={{
            width: '100%',
            height: '100%',
            border: 0,
            display: 'block',
          }}
        />
      </Box>
    </Box>
  )
}
