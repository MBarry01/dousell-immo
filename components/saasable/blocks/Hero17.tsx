'use client';

// @mui
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// @third-party
import { motion } from 'framer-motion';

// @project
import ButtonAnimationWrapper from '@/components/saasable/ui/ButtonAnimationWrapper';
import GraphicsCard from '@/components/saasable/ui/cards/GraphicsCard';
import ContainerWrapper from '@/components/saasable/ui/ContainerWrapper';
import GraphicsImage from '@/components/saasable/ui/GraphicsImage';
import SvgIcon from '@/components/saasable/ui/SvgIcon';
import { SECTION_COMMON_PY } from '@/components/saasable/utils/constant';
import { getBackgroundDots } from '@/components/saasable/utils/getBackgroundDots';
import { withAlpha } from '@/components/saasable/utils/colorUtils';

// @assets
import Wave from '@/components/saasable/images/graphics/Wave';

/***************************  HERO - 17  ***************************/

export default function Hero17({ chip, headLine, captionLine, primaryBtn, videoSrc, videoThumbnail, listData }: any) {
    return (
        <ContainerWrapper sx={{ py: SECTION_COMMON_PY }}>
            <Grid container spacing={{ xs: 5, md: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Stack sx={{ gap: 3, alignItems: 'flex-start', height: 1, justifyContent: 'center' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Chip label={chip?.label} sx={{ bgcolor: 'grey.100', ...chip?.sx }} size="small" />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Typography variant="h1">
                                {headLine}
                                <Box
                                    component="span"
                                    sx={{
                                        ml: 2,
                                        display: 'inline-block',
                                        position: 'relative',
                                        '&:after': {
                                            content: '""',
                                            position: 'absolute',
                                            bottom: -15,
                                            left: 0,
                                            width: 1,
                                            height: 10,
                                            background: 'url(/assets/images/graphics/wave.svg) no-repeat center/contain' // Replaced with inline Wave component below
                                        }
                                    }}
                                >
                                    {/* Wave component replacement if logic allows, or keep text clean */}
                                    <span style={{ position: 'absolute', bottom: -12, left: 0, width: '100%' }}>
                                        <Wave size="100%" />
                                    </span>
                                </Box>
                            </Typography>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Typography variant="h6" sx={{ color: 'text.secondary', maxWidth: 450 }}>
                                {captionLine}
                            </Typography>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
                                <ButtonAnimationWrapper>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={<SvgIcon name="tabler-sparkles" color="black" />} // Gold on Black need contrast? Primary is Gold. Button text black?
                                        {...primaryBtn}
                                    />
                                </ButtonAnimationWrapper>
                            </Stack>
                        </motion.div>
                    </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Stack sx={{ alignItems: 'flex-end' }}>
                        {/* Video or Image Area */}
                        <GraphicsCard sx={{ width: 1, height: 400, bgcolor: 'grey.200' }}>
                            {/* Placeholder for video/image */}
                            {videoThumbnail ? (
                                <GraphicsImage image={videoThumbnail} sx={{ width: 1, height: 1, objectFit: 'cover' }} />
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 1 }}>
                                    <Typography>Video Placeholder</Typography>
                                </Box>
                            )}
                        </GraphicsCard>
                    </Stack>
                </Grid>
            </Grid>
        </ContainerWrapper>
    );
}
