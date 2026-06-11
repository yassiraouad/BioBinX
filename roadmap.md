# Function Roadmap

## Grunnlaget
- [ ] Baseline architecture review (auth, data, UI, APIs).
- [ ] Prioritize workstream by module risk and user impact.
- [ ] Track delivery status for every discovered function below.

Function inventory generated from `67` files and `427` function declarations.

## Roadmap by File
### `components/AIAssistant.js`
- [ ] `AIAssistant` (L5)
- [ ] `getContext` (L17)
- [ ] `handleSend` (L38)

### `components/AddBinModal.js`
- [ ] `AddBinModal` (L9)
- [ ] `loadClasses` (L45)
- [ ] `parseQrCode` (L58)
- [ ] `startQrScanner` (L66)
- [ ] `stopQrScanner` (L100)
- [ ] `resetScanner` (L109)
- [ ] `startBtScan` (L115)
- [ ] `selectBtDevice` (L150)
- [ ] `handleSubmit` (L156)

### `components/AnnouncementsManager.js`
- [ ] `AnnouncementsManager` (L7)
- [ ] `loadAnnouncements` (L22)
- [ ] `handleSubmit` (L34)
- [ ] `handleEdit` (L76)
- [ ] `handleDelete` (L86)
- [ ] `getStatusBadge` (L98)

### `components/CO2Prognose.js`
- [ ] `CO2Prognose` (L5)
- [ ] `loadPrognosis` (L14)

### `components/CertificateModal.js`
- [ ] `CertificateModal` (L5)
- [ ] `handlePrint` (L23)

### `components/ChallengeQuizEditor.js`
- [ ] `ChallengeQuizEditor` (L6)
- [ ] `loadData` (L21)
- [ ] `handleSaveChallenge` (L34)
- [ ] `handleSaveQuiz` (L73)
- [ ] `addQuestion` (L100)
- [ ] `updateQuestion` (L107)
- [ ] `updateOption` (L113)
- [ ] `Save` (L238)

### `components/Challenges.js`
- [ ] `Challenges` (L5)
- [ ] `loadData` (L14)
- [ ] `isCompleted` (L41)

### `components/ContentEditor.js`
- [ ] `ContentEditor` (L13)
- [ ] `loadBlocks` (L24)
- [ ] `handleSave` (L43)

### `components/DemoBanner.js`
- [ ] `DemoBanner` (L6)
- [ ] `handleRegister` (L12)
- [ ] `handleLogin` (L17)

### `components/EcoLevelBadge.js`
- [ ] `EcoLevelBadge` (L4)

### `components/GroupModal.js`
- [ ] `GroupModal` (L6)
- [ ] `loadGroups` (L29)
- [ ] `loadClasses` (L42)
- [ ] `loadClassStudents` (L55)
- [ ] `handleOpenCreate` (L65)
- [ ] `handleOpenEdit` (L72)
- [ ] `handleOpenMembers` (L79)
- [ ] `handleCreate` (L85)
- [ ] `handleUpdate` (L113)
- [ ] `handleDelete` (L134)
- [ ] `handleAssignStudent` (L151)

### `components/GroupStats.js`
- [ ] `GroupStats` (L6)
- [ ] `loadStats` (L17)

### `components/Klasseligaen.js`
- [ ] `Klasseligaen` (L5)
- [ ] `loadLeaderboard` (L13)

### `components/LanguageSelector.js`
- [ ] `LanguageSelector` (L13)
- [ ] `handleSelect` (L18)
- [ ] `useTranslation` (L68)

### `components/ManualWeightModal.js`
- [ ] `ManualWeightModal` (L6)
- [ ] `handleSubmit` (L14)

### `components/MessagesCenter.js`
- [ ] `MessagesCenter` (L8)
- [ ] `loadConversations` (L35)
- [ ] `loadMessages` (L55)
- [ ] `handleSend` (L68)
- [ ] `formatTime` (L88)
- [ ] `formatDate` (L94)

### `components/MilestoneModal.js`
- [ ] `MilestoneModal` (L18)

### `components/MonthlyRecapModal.js`
- [ ] `MonthlyRecapModal` (L4)

### `components/NotificationToggle.js`
- [ ] `NotificationToggle` (L6)
- [ ] `handleToggle` (L16)

### `components/ProgressionMap.js`
- [ ] `ProgressionMap` (L11)

### `components/QRCodeGenerator.js`
- [ ] `QRCodeGenerator` (L5)
- [ ] `handleDownload` (L10)
- [ ] `handlePrint` (L40)

### `components/SeasonalCampaignBanner.js`
- [ ] `Globe` (L67)
- [ ] `Moon` (L77)
- [ ] `SeasonalCampaignBanner` (L85)
- [ ] `handleDismiss` (L96)
- [ ] `CampaignBadge` (L130)

### `components/SmartAvfallsanalyse.js`
- [ ] `SmartAvfallsanalyse` (L5)
- [ ] `loadCachedInsight` (L14)
- [ ] `generateInsight` (L30)

### `components/WeeklyHeroDisplay.js`
- [ ] `WeeklyHeroDisplay` (L6)
- [ ] `loadWeeklyHero` (L16)

### `components/WeeklyQuiz.js`
- [ ] `WeeklyQuiz` (L5)
- [ ] `loadQuiz` (L18)
- [ ] `handleAnswer` (L36)
- [ ] `restartQuiz` (L64)

### `components/WeeklyReport.js`
- [ ] `WeeklyReport` (L7)
- [ ] `generatePDF` (L11)

### `components/layout/Layout.js`
- [ ] `Layout` (L59)
- [ ] `getNav` (L67)
- [ ] `handleLogout` (L80)
- [ ] `getRoleLabel` (L90)
- [ ] `getRoleColor` (L97)

### `firebase/auth.js`
- [ ] `registerUser` (L3)
- [ ] `loginUser` (L67)
- [ ] `logoutUser` (L94)
- [ ] `getUserData` (L111)
- [ ] `subscribeToAuth` (L122)
- [ ] `upgradeToAdmin` (L130)

### `firebase/db.js`
- [ ] `ensureFirebase` (L3)
- [ ] `generateId` (L9)
- [ ] `logWaste` (L13)
- [ ] `getUserLogs` (L80)
- [ ] `getClassLogs` (L87)
- [ ] `getStudentLeaderboard` (L94)
- [ ] `getClassLeaderboard` (L109)
- [ ] `createClass` (L116)
- [ ] `getTeacherClasses` (L136)
- [ ] `getClassStudents` (L168)
- [ ] `getClassData` (L175)
- [ ] `checkBadges` (L190)
- [ ] `getGlobalStats` (L220)
- [ ] `getAllUsers` (L232)
- [ ] `getAllClasses` (L238)
- [ ] `getAllWasteLogs` (L244)
- [ ] `getAdminStats` (L251)
- [ ] `deleteUser` (L280)
- [ ] `deleteClass` (L284)
- [ ] `deleteWasteLog` (L288)
- [ ] `updateUser` (L292)
- [ ] `updateClass` (L296)
- [ ] `createSchool` (L300)
- [ ] `getSchoolByCode` (L312)
- [ ] `getAllSchools` (L321)
- [ ] `createGroup` (L327)
- [ ] `getSchoolGroups` (L338)
- [ ] `getAllGroups` (L345)
- [ ] `deleteGroup` (L351)
- [ ] `getSchool` (L355)
- [ ] `deleteSchool` (L363)
- [ ] `getSchoolClasses` (L367)
- [ ] `getSchoolLeaderboard` (L374)
- [ ] `getSchoolStudentLeaderboard` (L381)
- [ ] `getWeekStart` (L393)
- [ ] `setUserWeeklyGoal` (L402)
- [ ] `setClassWeeklyGoal` (L411)
- [ ] `getWeeklyWaste` (L420)
- [ ] `checkAndAwardGoalPoints` (L437)
- [ ] `checkAndAwardClassGoalPoints` (L466)
- [ ] `addBin` (L503)
- [ ] `getBinsByTeacher` (L525)
- [ ] `checkBinExists` (L532)
- [ ] `createClassGroup` (L537)
- [ ] `updateClassGroup` (L553)
- [ ] `deleteClassGroup` (L560)
- [ ] `getGroupsByClass` (L588)
- [ ] `getGroupsByTeacher` (L595)
- [ ] `getGroupById` (L606)
- [ ] `assignUserToGroup` (L612)
- [ ] `assignBinToGroup` (L643)
- [ ] `getGroupStats` (L674)
- [ ] `getEcoLevel` (L747)
- [ ] `getEcoLevelProgress` (L754)
- [ ] `addClassEcoPoints` (L762)
- [ ] `getClassLeaderboardWithStreak` (L771)
- [ ] `getChallenges` (L812)
- [ ] `createChallenge` (L820)
- [ ] `checkChallengeCompletion` (L835)
- [ ] `getClassTrophies` (L877)
- [ ] `seedWeeklyChallenges` (L883)
- [ ] `getWeeklyInsight` (L911)
- [ ] `getCO2Prognosis` (L952)
- [ ] `dailyCheckIn` (L992)
- [ ] `getQuizForWeek` (L1036)
- [ ] `submitQuizAnswer` (L1062)
- [ ] `createReminder` (L1092)
- [ ] `getRemindersByClass` (L1106)
- [ ] `toggleReminder` (L1112)
- [ ] `deleteReminder` (L1116)
- [ ] `createNotification` (L1120)
- [ ] `getNotifications` (L1133)
- [ ] `getUnreadCount` (L1139)
- [ ] `markNotificationRead` (L1145)
- [ ] `markAllNotificationsRead` (L1149)
- [ ] `checkInactivityReminders` (L1158)
- [ ] `addReaction` (L1189)
- [ ] `createGroupMessage` (L1215)
- [ ] `getGroupMessages` (L1238)
- [ ] `deleteGroupMessage` (L1244)
- [ ] `getAllSchoolLeaderboard` (L1248)
- [ ] `setClassWeeklyGoalKg` (L1274)
- [ ] `getUserProfile` (L1278)
- [ ] `linkChildToParent` (L1296)
- [ ] `getParentChildData` (L1301)
- [ ] `setUserLanguage` (L1311)
- [ ] `manualWeightEntry` (L1315)
- [ ] `getBinHistory` (L1340)
- [ ] `updateBinHealthStatus` (L1346)
- [ ] `getAllBinsHealth` (L1365)
- [ ] `setUserThemePreference` (L1377)
- [ ] `getUserThemePreference` (L1381)
- [ ] `addActivityEvent` (L1387)
- [ ] `getActivityFeed` (L1399)
- [ ] `setUserFavorites` (L1405)
- [ ] `getUserFavorites` (L1409)
- [ ] `getBinStats` (L1415)
- [ ] `getAllBinsStats` (L1437)
- [ ] `searchData` (L1450)
- [ ] `createConversationId` (L1480)
- [ ] `createDirectMessage` (L1484)
- [ ] `getConversations` (L1521)
- [ ] `getDirectMessages` (L1527)
- [ ] `getTotalUnreadMessages` (L1545)
- [ ] `getOrCreateConversation` (L1557)
- [ ] `createAnnouncement` (L1574)
- [ ] `getAnnouncementsByClass` (L1592)
- [ ] `getActiveAnnouncement` (L1598)
- [ ] `updateAnnouncement` (L1605)
- [ ] `deleteAnnouncement` (L1609)
- [ ] `dismissAnnouncement` (L1613)
- [ ] `getContentBlocks` (L1624)
- [ ] `updateContentBlock` (L1633)
- [ ] `getAllChallenges` (L1641)
- [ ] `updateChallenge` (L1646)
- [ ] `createQuiz` (L1650)
- [ ] `getAllQuizzes` (L1661)
- [ ] `updateQuiz` (L1666)
- [ ] `deleteQuiz` (L1670)
- [ ] `updateSchoolWelcomeMessage` (L1674)
- [ ] `dismissSchoolMessage` (L1682)
- [ ] `getSchoolStats` (L1693)
- [ ] `getSeasonalChallenges` (L1748)
- [ ] `getActiveCampaign` (L1761)
- [ ] `createCampaign` (L1775)
- [ ] `getAllCampaigns` (L1790)
- [ ] `toggleCampaign` (L1795)
- [ ] `getWeeklyHero` (L1799)
- [ ] `setWeeklyHero` (L1828)
- [ ] `addMilestone` (L1835)
- [ ] `checkMilestones` (L1848)
- [ ] `isEnvironmentDay` (L1871)
- [ ] `updateEnvironmentDayStats` (L1876)
- [ ] `isSkolestartMonth` (L1907)
- [ ] `getSeasonalBadges` (L1912)
- [ ] `awardSeasonalBadge` (L1925)
- [ ] `generateUniquePIN` (L1936)
- [ ] `createLiveSession` (L1949)
- [ ] `getLiveSessionByPIN` (L1974)
- [ ] `getLiveSession` (L1983)
- [ ] `joinLiveSession` (L1990)
- [ ] `submitAnswer` (L2007)
- [ ] `getSessionPlayers` (L2044)
- [ ] `updateSessionStatus` (L2051)
- [ ] `startQuestion` (L2063)
- [ ] `showResults` (L2072)
- [ ] `endQuiz` (L2077)
- [ ] `getLeaderboardRank` (L2116)
- [ ] `createQuizNotification` (L2131)
- [ ] `getQuizQuestionTemplates` (L2148)
- [ ] `saveQuizTemplate` (L2155)
- [ ] `addEcoPoints` (L2166)
- [ ] `addActivityFeedEntry` (L2178)
- [ ] `getAdmins` (L2189)
- [ ] `isAdmin` (L2196)
- [ ] `addAdmin` (L2202)
- [ ] `removeAdmin` (L2212)
- [ ] `getAllAdminUsers` (L2217)
- [ ] `getQuizHistory` (L2225)
- [ ] `getQuizHistoryForClass` (L2252)
- [ ] `getQuizHistoryForStudent` (L2276)
- [ ] `addBonusPointsToUser` (L2313)
- [ ] `addBonusPointsToClass` (L2333)
- [ ] `resetUserPoints` (L2348)
- [ ] `resetClassPoints` (L2354)
- [ ] `resetAllPoints` (L2369)
- [ ] `resetAllWaste` (L2384)
- [ ] `deleteAllUsers` (L2406)
- [ ] `deleteAllClasses` (L2422)

### `firebase/messaging.js`
- [ ] `requestNotificationPermission` (L24)
- [ ] `onNotificationReceived` (L42)
- [ ] `showLocalNotification` (L57)

### `hooks/useAuth.js`
- [ ] `AuthProvider` (L6)
- [ ] `refreshUserData` (L33)
- [ ] `useAuth` (L51)

### `hooks/useDemo.js`
- [ ] `cloneInitialLocalState` (L114)
- [ ] `safeParse` (L124)
- [ ] `getComputedDemoData` (L132)
- [ ] `DemoProvider` (L208)
- [ ] `persistDemoState` (L221)
- [ ] `applyPayload` (L247)
- [ ] `onStorage` (L280)
- [ ] `startDemo` (L303)
- [ ] `startDemoWithCredentials` (L314)
- [ ] `switchDemoRole` (L326)
- [ ] `exitDemo` (L334)
- [ ] `updateLocalState` (L341)
- [ ] `addScan` (L358)
- [ ] `addReaction` (L384)
- [ ] `completeChallenge` (L390)
- [ ] `useDemo` (L423)

### `pages/_app.js`
- [ ] `App` (L9)

### `pages/about.js`
- [ ] `About` (L5)

### `pages/api/admin/verify.js`
- [ ] `POST` (L6)

### `pages/api/ai-assistant.js`
- [ ] `checkRateLimit` (L3)
- [ ] `sanitizeHTML` (L18)

### `pages/api/quiz/generate.js`
- [ ] `checkRateLimit` (L3)
- [ ] `sanitizeString` (L18)
- [ ] `validateQuestion` (L23)
- [ ] `extractJSON` (L45)

### `pages/api/quiz/submit-answer.js`
- [ ] `checkRateLimit` (L6)
- [ ] `POST` (L24)

### `pages/auth/login.js`
- [ ] `Login` (L10)
- [ ] `handleLogin` (L18)
- [ ] `handleDemoLogin` (L60)
- [ ] `fillDemoCredentials` (L65)

### `pages/auth/signup.js`
- [ ] `Signup` (L9)
- [ ] `update` (L15)
- [ ] `handleSignup` (L17)

### `pages/dashboard/admin.js`
- [ ] `AdminDashboard` (L13)
- [ ] `loadStats` (L56)
- [ ] `loadSchools` (L66)
- [ ] `loadGroups` (L78)
- [ ] `handleCreateSchool` (L107)
- [ ] `handleDeleteSchool` (L123)
- [ ] `handleCreateGroup` (L134)
- [ ] `handleDeleteGroup` (L152)
- [ ] `handleDeleteUser` (L163)
- [ ] `handleDeleteClass` (L174)
- [ ] `handleDeleteLog` (L185)
- [ ] `handleSaveUser` (L196)
- [ ] `handleSaveClass` (L207)
- [ ] `loadAdmins` (L218)
- [ ] `handleAddAdmin` (L227)
- [ ] `handleRemoveAdmin` (L270)
- [ ] `handleGiveBonusToUser` (L281)
- [ ] `handleGiveBonusToClass` (L302)
- [ ] `handleResetUserPoints` (L322)
- [ ] `handleResetClassPoints` (L333)
- [ ] `handleResetAllPoints` (L344)
- [ ] `handleResetAllWaste` (L356)
- [ ] `handleDeleteAllUsers` (L368)
- [ ] `handleDeleteAllClasses` (L380)

### `pages/dashboard/classes.js`
- [ ] `ClassesPage` (L11)
- [ ] `toggleExpand` (L62)
- [ ] `handleOpenModal` (L71)
- [ ] `handleSchoolChange` (L88)
- [ ] `handleCreate` (L99)

### `pages/dashboard/demo-student.js`
- [ ] `rankFromPoints` (L10)
- [ ] `formatRelativeTime` (L17)
- [ ] `DemoStudentDashboard` (L28)

### `pages/dashboard/demo-teacher.js`
- [ ] `DemoTeacherDashboard` (L13)

### `pages/dashboard/parent.js`
- [ ] `ParentDashboard` (L11)
- [ ] `loadChildData` (L29)

### `pages/dashboard/rector.js`
- [ ] `RectorDashboard` (L10)
- [ ] `loadSchoolStats` (L28)

### `pages/dashboard/student.js`
- [ ] `CustomTooltip` (L19)
- [ ] `StudentDashboard` (L31)

### `pages/dashboard/teacher.js`
- [ ] `TeacherDashboard` (L21)
- [ ] `handleOpenCreateModal` (L81)
- [ ] `handleSchoolChange` (L99)
- [ ] `handleCreateClass` (L110)
- [ ] `handleSetGoal` (L135)
- [ ] `truncateName` (L164)

### `pages/index.js`
- [ ] `AnimatedCounter` (L7)
- [ ] `Landing` (L27)
- [ ] `handleScroll` (L32)

### `pages/leaderboard.js`
- [ ] `Leaderboard` (L13)

### `pages/onboarding.js`
- [ ] `Onboarding` (L9)
- [ ] `handleRoleSelect` (L20)
- [ ] `handleClassJoin` (L25)
- [ ] `handleCreateClass` (L56)
- [ ] `handleComplete` (L60)

### `pages/profile/[uid].js`
- [ ] `EcoProfilePage` (L11)
- [ ] `loadProfile` (L50)

### `pages/quiz.js`
- [ ] `Quiz` (L9)
- [ ] `handleAnswer` (L28)
- [ ] `handleNext` (L37)
- [ ] `restart` (L47)

### `pages/quiz/create.js`
- [ ] `CreateQuiz` (L12)
- [ ] `handleGenerateQuestions` (L40)
- [ ] `addDefaultQuestion` (L59)
- [ ] `updateQuestion` (L70)
- [ ] `removeQuestion` (L88)
- [ ] `moveQuestion` (L92)
- [ ] `addFromDefaults` (L100)
- [ ] `handleCreateSession` (L111)

### `pages/quiz/history.js`
- [ ] `QuizHistory` (L10)
- [ ] `loadHistory` (L28)
- [ ] `formatDate` (L41)

### `pages/quiz/host-results.js`
- [ ] `HostResults` (L10)
- [ ] `loadSession` (L27)
- [ ] `handleFinish` (L45)

### `pages/quiz/host.js`
- [ ] `HostQuiz` (L12)
- [ ] `loadSession` (L31)
- [ ] `handleNext` (L102)

### `pages/quiz/join.js`
- [ ] `JoinQuiz` (L9)
- [ ] `handleJoin` (L15)

### `pages/quiz/lobby-student.js`
- [ ] `LobbyStudent` (L11)
- [ ] `loadSession` (L27)

### `pages/quiz/lobby-teacher.js`
- [ ] `LobbyTeacher` (L12)
- [ ] `loadSession` (L29)
- [ ] `handleStartQuiz` (L75)
- [ ] `handleEndSession` (L91)

### `pages/quiz/play.js`
- [ ] `PlayQuiz` (L10)
- [ ] `loadSession` (L37)
- [ ] `handleAnswer` (L113)
- [ ] `handleTimeout` (L145)

### `pages/quiz/player-results.js`
- [ ] `PlayerResults` (L8)
- [ ] `loadResults` (L27)

### `pages/scan.js`
- [ ] `ScanPage` (L13)
- [ ] `toggleCamera` (L61)
- [ ] `initCamera` (L75)
- [ ] `capturePhoto` (L105)
- [ ] `retake` (L130)
- [ ] `handleSave` (L139)

### `pages/stats.js`
- [ ] `CustomTooltip` (L14)
- [ ] `Stats` (L26)

### `utils/calculator.js`
- [ ] `calculateEnergy` (L3)
- [ ] `calculateCO2Saved` (L8)
- [ ] `calculatePoints` (L13)
- [ ] `formatNumber` (L17)
- [ ] `energyEquivalent` (L22)
- [ ] `getRank` (L29)
- [ ] `getWeeklyData` (L37)
- [ ] `exportToCSV` (L59)
- [ ] `exportLogsToCSV` (L84)
- [ ] `exportStudentsToCSV` (L106)
- [ ] `exportClassStatsToCSV` (L124)

### `utils/helpers.js`
- [ ] `arrayMove` (L1)
- [ ] `formatTime` (L9)
- [ ] `shuffleArray` (L15)

### `utils/wasteClassifier.js`
- [ ] `loadModel` (L61)
- [ ] `classifyFromPredictions` (L86)
- [ ] `classifyWaste` (L138)
- [ ] `classifyWasteFromDataUrl` (L146)
