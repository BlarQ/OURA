import { Project } from '@/types';
import { supabase, localStore, saveLocalStore } from '../supabase/client';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    let dbProjects: Project[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          dbProjects = data as any;
        }
      } catch (e) {}
    }

    const dbProjectIds = new Set(dbProjects.map((p) => p.id));
    const localOnlyProjects = localStore.projects.filter((p) => !dbProjectIds.has(p.id));
    const allProjects = [...dbProjects, ...localOnlyProjects];

    return allProjects.map((p) => {
      const projectTasks = localStore.tasks.filter((t) => t.project_id === p.id);
      const completedTasks = projectTasks.filter((t) => t.status === 'Completed').length;
      const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : (p.progress || 0);

      const projectActivities = localStore.activities.filter((a) => a.project_id === p.id);
      const timeSpentMinutes = projectActivities.reduce((acc, a) => acc + (a.duration_minutes || 0), 0);

      return {
        ...p,
        total_tasks_count: projectTasks.length,
        completed_tasks_count: completedTasks,
        time_spent_minutes: timeSpentMinutes,
        progress,
      };
    });
  },

  async createProject(data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const today = new Date().toISOString().split('T')[0];
    const newProject: Project = {
      ...data,
      id: `proj_${Date.now()}`,
      user_id: localStore.profile.id,
      created_at: today,
      updated_at: today,
      progress: data.progress || 0,
    };

    localStore.projects.unshift(newProject);
    saveLocalStore();

    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || localStore.profile.id;

        const { data: projData, error } = await supabase
          .from('projects')
          .insert([{
            user_id: userId,
            name: data.name,
            description: data.description || '',
            start_date: data.start_date || today,
            end_date: data.end_date || today,
            status: data.status || 'Active',
            priority: data.priority || 'Medium',
            progress: data.progress || 0,
          }])
          .select('*')
          .single();

        if (!error && projData) {
          const index = localStore.projects.findIndex((p) => p.id === newProject.id);
          if (index !== -1) {
            localStore.projects[index] = { ...newProject, ...projData };
            saveLocalStore();
          }
          return { ...newProject, ...projData };
        }
      } catch (e) {}
    }

    return newProject;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    if (supabase && !id.startsWith('proj_')) {
      try {
        await supabase
          .from('projects')
          .update(updates)
          .eq('id', id);
      } catch (e) {}
    }

    const index = localStore.projects.findIndex((p) => p.id === id);
    if (index !== -1) {
      const updated = {
        ...localStore.projects[index],
        ...updates,
        updated_at: new Date().toISOString().split('T')[0],
      };
      localStore.projects[index] = updated;
      saveLocalStore();
      return updated;
    }

    return null;
  },

  async deleteProject(id: string): Promise<boolean> {
    if (supabase && !id.startsWith('proj_')) {
      try {
        await supabase.from('projects').delete().eq('id', id);
      } catch (e) {}
    }
    localStore.projects = localStore.projects.filter((p) => p.id !== id);
    saveLocalStore();
    return true;
  },
};
