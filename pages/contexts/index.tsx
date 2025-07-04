import React, { useState, useEffect } from 'react'
import Header from '../../components/Header'
import ContextEditor from '../../components/ContextEditor'

interface ContextProfile {
  id: string
  role: string
  basePrompt: string
  maintainedBy: string
}

export default function ContextsPage() {
  const [contexts, setContexts] = useState<ContextProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    role: '',
    basePrompt: ''
  })

  useEffect(() => {
    fetchContexts()
  }, [])

  const fetchContexts = async () => {
    try {
      const response = await fetch('/api/context-profiles')
      if (!response.ok) {
        throw new Error('Failed to fetch contexts')
      }
      const data = await response.json()
      setContexts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (contextData: Omit<ContextProfile, 'id' | 'maintainedBy'>) => {
    try {
      const method = isCreating ? 'POST' : 'PUT'
      const url = isCreating 
        ? '/api/context-profiles' 
        : `/api/context-profiles/${editingId}`
      
      const body = isCreating 
        ? { ...contextData, maintainedBy: 'current-user' } // TODO: Replace with actual user
        : contextData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error('Failed to save context')
      }

      await fetchContexts()
      setIsCreating(false)
      setEditingId(null)
      setFormData({ role: '', basePrompt: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const handleEdit = (context: ContextProfile) => {
    setEditingId(context.id)
    setFormData({
      role: context.role,
      basePrompt: context.basePrompt
    })
  }

  const handleDelete = async (context: ContextProfile) => {
    if (!confirm(`정말로 "${context.role}" 컨텍스트를 삭제하시겠습니까?`)) return

    try {
      const response = await fetch(`/api/context-profiles/${context.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete context')
      }

      await fetchContexts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({ role: '', basePrompt: '' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">Error: {error}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-6 py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-extrabold text-gray-900">
                역할별 컨텍스트 설정
              </h1>
              {!isCreating && !editingId && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  새 컨텍스트 추가
                </button>
              )}
            </div>

            {(isCreating || editingId) && (
              <ContextEditor
                context={editingId ? contexts.find(c => c.id === editingId) : undefined}
                onSave={handleSave}
                onCancel={handleCancel}
                isEditing={!!editingId}
              />
            )}
            
            {contexts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">등록된 컨텍스트가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contexts.map((context) => (
                  <div key={context.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {context.role}
                        </h3>
                        <p className="text-sm text-gray-500">
                          관리자: {context.maintainedBy}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(context)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => handleDelete(context)}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-1 px-3 rounded"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-md p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">기본 프롬프트:</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {context.basePrompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}