import api from '../lib/api'
import { AxiosError } from 'axios'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Task {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  isDone: boolean
  schedule: Date
  reminderOffsetMinutes?: number
  createdAt: Date
  updatedAt: Date
}

interface PaginationParams {
  page?: number
  perPage?: number
}

interface PaginationResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}

export const taskService = {
  /**
   * Busca todas as tarefas com paginação e filtros
   */
  async fetchTasks(
    pagination?: PaginationParams,
    filters?: {
      status?: boolean
      priority?: TaskPriority
      type?: 'today' | 'upcoming' | 'pending'
    }
  ): Promise<PaginationResponse<Task>> {
    try {
      const response = await api.get<PaginationResponse<Task>>('/tasks', {
        params: {
          ...pagination,
          ...filters,
        },
      })

      return response.data
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }
      
      throw new Error('Não foi possível buscar as tarefas.')
    }
  },

  /**
   * Busca uma tarefa por ID
   */
  async getTaskById(id: string): Promise<Task> {
    try {
      const response = await api.get<{ task: Task }>(`/tasks/${id}`)
      return response.data.task
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }
      
      throw new Error('Não foi possível buscar a tarefa.')
    }
  },

  /**
   * Cria uma nova tarefa
   */
  async createTask(data: {
    title: string
    priority: TaskPriority
    description?: string
    schedule: Date
    reminderOffsetMinutes?: number
  }): Promise<Task> {
    try {
      const response = await api.post<{ task: Task }>('/tasks', data)
      return response.data.task
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }
      
      throw new Error('Não foi possível criar a tarefa.')
    }
  },

  /**
   * Atualiza uma tarefa existente
   */
  async updateTask(
    id: string,
    data: {
      title?: string
      priority?: TaskPriority
      description?: string
      isDone?: boolean
      schedule?: Date
      reminderOffsetMinutes?: number
    }
  ): Promise<Task> {
    try {
      const response = await api.put<{ task: Task }>(`/tasks/${id}`, data)
      return response.data.task
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }
      
      throw new Error('Não foi possível atualizar a tarefa.')
    }
  },

  /**
   * Deleta uma tarefa
   */
  async deleteTask(id: string): Promise<void> {
    try {
      await api.delete(`/tasks/${id}`)
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }
      
      throw new Error('Não foi possível excluir a tarefa.')
    }
  },

  /**
   * Marca/desmarca uma tarefa como concluída
   */
  async toggleTaskCompletion(id: string, isDone: boolean): Promise<Task> {
    try {
      const response = await api.put<{ task: Task }>(`/tasks/${id}`, { isDone })
      return response.data.task
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      
      if (axiosError.response?.data?.message) {
        throw new Error(axiosError.response.data.message)
      }
      
      throw new Error('Não foi possível atualizar o status da tarefa.')
    }
  },
}
