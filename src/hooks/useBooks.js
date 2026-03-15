import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useBooks() {
  const { user }                    = useAuth()
  const [books,   setBooks]         = useState([])
  const [loading, setLoading]       = useState(true)

  const fetchBooks = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })
    setBooks(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchBooks() }, [fetchBooks])

  // ── SAVE / UPDATE ──────────────────────────────────────
  const saveBook = async (book) => {
    const { pages, ...meta } = book
    const row = {
      ...meta,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('books')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (error) throw error
    await fetchBooks()
    return data
  }

  // ── DELETE ─────────────────────────────────────────────
  const deleteBook = async (bookId, title) => {
    await supabase.from('books').delete().eq('id', bookId)
    // Remove PDF from storage
    await supabase.storage.from('pdfs').remove([`${user.id}/${bookId}.pdf`])
    // Remove cover from storage
    await supabase.storage.from('covers').remove([`${user.id}/${bookId}.jpg`])
    await fetchBooks()
  }

  // ── UPLOAD PDF ─────────────────────────────────────────
  const uploadPDF = async (bookId, file) => {
    const path = `${user.id}/${bookId}.pdf`
    const { error } = await supabase.storage
      .from('pdfs')
      .upload(path, file, { upsert: true })
    if (error) throw error
    return path
  }

  // ── UPLOAD COVER ───────────────────────────────────────
  const uploadCover = async (bookId, file) => {
    const path = `${user.id}/${bookId}.jpg`
    const { error } = await supabase.storage
      .from('covers')
      .upload(path, file, { upsert: true, contentType: 'image/jpeg' })
    if (error) throw error
    const { data } = supabase.storage.from('covers').getPublicUrl(path)
    return data.publicUrl
  }

  // ── UPDATE PROGRESS ────────────────────────────────────
  const updateProgress = async (bookId, progress) => {
    await supabase.from('books').update({ progress }).eq('id', bookId)
    setBooks(b => b.map(x => x.id === bookId ? { ...x, progress } : x))
  }

  // ── UPDATE QUESTIONS ───────────────────────────────────
  const updateQuestions = async (bookId, questions) => {
    await supabase.from('books').update({ questions }).eq('id', bookId)
    setBooks(b => b.map(x => x.id === bookId ? { ...x, questions } : x))
  }

  // ── SAVE REFLECTION ────────────────────────────────────
  const saveReflection = async (bookId, reflection) => {
    const book = books.find(b => b.id === bookId)
    const refs  = [...(book?.reflections ?? []), reflection]
    await supabase.from('books').update({ reflections: refs }).eq('id', bookId)
    setBooks(b => b.map(x => x.id === bookId ? { ...x, reflections: refs } : x))
  }

  return {
    books, loading, fetchBooks,
    saveBook, deleteBook, uploadPDF, uploadCover,
    updateProgress, updateQuestions, saveReflection,
  }
}
