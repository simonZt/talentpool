import request from '@/utils/request'

// Auth
// 修改登录接口以匹配后端 OAuth2PasswordRequestForm 格式
export const login = (data: any) => {
  return request.post('/auth/login', null, {
    params: data,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
}

export const getProfile = () => request.get('/auth/me')

// Dashboard
export const getStats = () => request.get('/dashboard/stats')

// System
export const getUsers = () => request.get('/users')
export const createUser = (data: any) => request.post('/users', data)
export const deleteUser = (id: number) => request.delete(`/users/${id}`)
export const changePassword = (id: number, pwd: string) => request.put(`/system/users/${id}/password?password=${pwd}`)

// Positions
export const getPositions = (params?: any) => request.get('/positions', { params })
export const createPosition = (data: any) => request.post('/positions', data)
export const updatePosition = (id: number, data: any) => request.put(`/positions/${id}`, data)
export const togglePositionStatus = (id: number, status: string) => request.patch(`/positions/${id}/status?status=${status}`)

// Resumes
export const checkDuplicate = (phone: string) => request.get(`/resumes/check?phone=${phone}`)
export const uploadResume = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/resumes/upload', formData)
}
export const saveResume = (data: any) => request.post('/resumes', data)
export const getResumes = () => request.get('/resumes')
export const updateResume = (id: number, data: any) => request.put(`/resumes/${id}`, data)
export const addCallback = (id: number, content: string) => request.post(`/resumes/${id}/callback`, { content })

// Interviews
export const getInterviews = () => request.get('/interviews')
export const createInterview = (data: any) => request.post('/interviews', data)
export const updateInterviewStatus = (id: number, status: string) => request.patch(`/interviews/${id}/status`, { status })
export const submitFeedback = (id: number, data: any) => request.post(`/interviews/${id}/feedback`, data)