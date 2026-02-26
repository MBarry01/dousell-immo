'use client';

import { useState } from 'react';

// @mui
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// @third-party
import { motion } from 'framer-motion';

// @project
import ContainerWrapper from '@/components/saasable/ui/ContainerWrapper';
import GraphicsCard from '@/components/saasable/ui/cards/GraphicsCard';
import SvgIcon from '@/components/saasable/ui/SvgIcon';
import Typeset from '@/components/saasable/components/Typeset';
import { SECTION_COMMON_PY } from '@/components/saasable/utils/constant';

// @assets
import ButtonAnimationWrapper from '@/components/saasable/ui/ButtonAnimationWrapper';
import GraphicsImage from '@/components/saasable/ui/GraphicsImage';

/***************************  FEATURE - 18  ***************************/

export default function Feature18({ heading, caption, topics }: any) {
    const boxPadding = { xs: 3, md: 5 };
    const imagePadding = { xs: 3, sm: 4, md: 5 };

    const [value, setValue] = useState('1');

    // Handle tab change
    const handleChange = (event: any, newValue: any) => {
        setValue(newValue);
    };

    return (
        <ContainerWrapper sx={{ py: SECTION_COMMON_PY }}>
            <Stack sx={{ gap: { xs: 3, sm: 4 } }}>
                <Typeset
                    {...{
                        heading,
                        caption,
                        stackProps: { sx: { alignItems: 'center', textAlign: 'center', maxWidth: { sm: 470, md: 615 }, mx: 'auto' } }
                    }}
                />
                <Stack sx={{ gap: 1.5, alignItems: 'center' }}>
                    <TabContext value={value}>
                        <GraphicsCard sx={{ width: { xs: 1, sm: 'unset' } }}>
                            <Box sx={{ p: 0.25 }}>
                                <TabList
                                    onChange={handleChange}
                                    sx={{ minHeight: 'unset', p: 0.25 }}
                                    // slotProps={{ indicator: { sx: { display: 'none' } } }}
                                    TabIndicatorProps={{ sx: { display: 'none' } }}
                                    variant="scrollable"
                                    scrollButtons={false}
                                >
                                    {topics.map((item: any, index: number) => (
                                        <Tab
                                            label={item.title}
                                            disableFocusRipple
                                            {...(item.icon && {
                                                icon: (
                                                    <SvgIcon
                                                        {...(typeof item.icon === 'string' ? { name: item.icon } : { ...item.icon })}
                                                        size={16}
                                                        stroke={2}
                                                        color="text.secondary"
                                                    />
                                                )
                                            })}
                                            value={String(index + 1)}
                                            key={index}
                                            iconPosition="start"
                                            tabIndex={0}
                                            sx={{
                                                minHeight: 44,
                                                minWidth: { xs: 112, md: 160, sm: 156 },
                                                borderRadius: 10,
                                                borderWidth: 1,
                                                borderStyle: 'solid',
                                                borderColor: 'transparent',
                                                '& svg ': { mr: 1 },
                                                '&.Mui-selected': {
                                                    bgcolor: 'grey.200',
                                                    borderColor: 'grey.400',
                                                    minWidth: { xs: 112, md: 160, sm: 156 },
                                                    color: 'text.primary',
                                                    '& svg': { stroke: 'text.primary' }
                                                },
                                                '&.Mui-focusVisible': { bgcolor: 'grey.300' },
                                                '&:hover': { bgcolor: 'grey.200' }
                                            }}
                                        />
                                    ))}
                                </TabList>
                            </Box>
                        </GraphicsCard>
                        {topics.map((item: any, index: number) => (
                            <TabPanel value={String(index + 1)} key={index} sx={{ p: 0, width: 1 }}>
                                {/* Using Grid v5 syntax and removing padding left */}
                                <Grid container spacing={1.5} sx={{ justifyContent: 'center' }}>

                                    {/* Left Side: GIF/Image */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <GraphicsCard>
                                            <motion.div
                                                initial={{ opacity: 0, x: -50, y: 0 }}
                                                whileInView={{ opacity: 1, x: 0, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.6 }}
                                            >
                                                <Box
                                                    sx={{
                                                        pl: item.isCoverImage ? 0 : imagePadding,
                                                        pt: item.isCoverImage ? 0 : imagePadding,
                                                        height: { xs: 260, sm: 396, md: 434 },
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        overflow: 'hidden', // Empêche l'image de dépasser
                                                        width: '100%' // Assure que la boîte prend toute la largeur
                                                    }}
                                                >
                                                    {/* Force img tag for GIF support */}
                                                    <GraphicsImage
                                                        cardMediaProps={{ component: 'img' }}
                                                        sx={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover', // Cover au lieu de contain pour remplir le bloc
                                                            ...(item.isImageBorder && { borderTop: '5px solid', borderLeft: '5px solid', borderColor: 'grey.200' }),
                                                            // Removed background props which contest with img tag usage
                                                            borderTopLeftRadius: { xs: 12 },
                                                            borderBottomRightRadius: { xs: 20, sm: 32, md: 40 }
                                                        }}
                                                        image={item.image}
                                                    />
                                                </Box>
                                            </motion.div>
                                        </GraphicsCard>
                                    </Grid>

                                    {/* Right Side: Text & Features List */}
                                    <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex' }}>
                                        <GraphicsCard overLay={true}> {/* No bgImage prop here */}
                                            <Stack
                                                sx={{
                                                    justifyContent: 'space-between',
                                                    gap: 5,
                                                    height: item.actionBtn || item.actionBtn2 ? { sm: 'calc(100% - 98px)', md: 'calc(100%  - 114px)' } : 1,
                                                    pt: boxPadding,
                                                    px: boxPadding
                                                }}
                                            >
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: 30 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 30 }}
                                                    transition={{ duration: 0.2, ease: 'linear', delay: index * 0.1 }}
                                                >
                                                    <Stack direction="row" sx={{ gap: 1 }}>
                                                        {item.icon && (
                                                            <SvgIcon
                                                                {...(typeof item.icon === 'string' ? { name: item.icon } : { ...item.icon })}
                                                                size={16}
                                                                stroke={2}
                                                                color="text.primary"
                                                            />
                                                        )}
                                                        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                                                            {item.title}
                                                        </Typography>
                                                    </Stack>
                                                </motion.div>
                                                <Stack sx={{ gap: { xs: 2, md: 3 }, pb: boxPadding }}>
                                                    <Stack sx={{ gap: 0.5 }}>
                                                        <Typography variant="h4">{item.title2}</Typography>
                                                        {item.description && <Typography sx={{ color: 'text.secondary' }}>{item.description}</Typography>}
                                                    </Stack>
                                                    {item.list && (
                                                        <Stack spacing={2} sx={{ mt: 1 }}>
                                                            {item.list.map((list: any, index: number) => (
                                                                <motion.div
                                                                    key={index}
                                                                    initial={{ opacity: 0, x: 30 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    exit={{ opacity: 0, x: 30 }}
                                                                    transition={{ duration: 0.2, ease: 'linear', delay: index * 0.1 }}
                                                                >
                                                                    <Stack
                                                                        direction="row"
                                                                        spacing={2}
                                                                        sx={{
                                                                            alignItems: 'center',
                                                                        }}
                                                                    >
                                                                        {/* Gold Check Icon Background */}
                                                                        <Box
                                                                            sx={{
                                                                                width: 32,
                                                                                height: 32,
                                                                                borderRadius: '50%',
                                                                                bgcolor: 'rgba(244, 196, 48, 0.1)',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                flexShrink: 0
                                                                            }}
                                                                        >
                                                                            <SvgIcon name="tabler-check" size={18} stroke={3} color="#F4C430" />
                                                                        </Box>
                                                                        <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                                                            {list.primary}
                                                                        </Typography>
                                                                    </Stack>
                                                                </motion.div>
                                                            ))}
                                                        </Stack>
                                                    )}
                                                </Stack>
                                            </Stack>
                                            {(item.actionBtn || item.actionBtn2) && (
                                                <GraphicsCard sx={{ bgcolor: 'grey.200' }}>
                                                    <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 1.5, p: { xs: 2, sm: 3, md: 4 } }}>
                                                        {item.actionBtn2 && (
                                                            <Box>
                                                                <ButtonAnimationWrapper>
                                                                    <Button
                                                                        variant="outlined"
                                                                        color="primary"
                                                                        startIcon={<SvgIcon name="tabler-help" size={16} stroke={3} />}
                                                                        {...item.actionBtn2}
                                                                    />
                                                                </ButtonAnimationWrapper>
                                                            </Box>
                                                        )}
                                                        {item.actionBtn && (
                                                            <Box>
                                                                <ButtonAnimationWrapper>
                                                                    <Button
                                                                        variant="contained"
                                                                        color="primary"
                                                                        startIcon={<SvgIcon name="tabler-link" size={16} stroke={3} color="background.default" />}
                                                                        {...item.actionBtn}
                                                                    />
                                                                </ButtonAnimationWrapper>
                                                            </Box>
                                                        )}
                                                    </Stack>
                                                </GraphicsCard>
                                            )}
                                        </GraphicsCard>
                                    </Grid>
                                </Grid>
                            </TabPanel>
                        ))}
                    </TabContext>
                </Stack>
            </Stack>
        </ContainerWrapper>
    );
}
